# Pruebas unitarias del módulo login (service, router y repository).

import pytest
from passlib.context import CryptContext

from app.core.security import verificarToken
from app.modules.login import repository as login_repository
from app.modules.login import router as login_router
from app.modules.login import service as login_service

from tests.unit.bd_falsa import Fila


# Se calcula una sola vez porque bcrypt es lento a propósito
HASH_123456 = CryptContext(schemes=["bcrypt"]).hash("123456")


def _usuario(estado="ACTIVO", password=HASH_123456):
    return {
        "id_usuario": 1,
        "nombre": "Carlos",
        "correo": "carlos@sgci.com",
        "password": password,
        "estado": estado,
        "id_rol": 2,
        "rol": "Jefe de Bodega",
    }


# ------------------------------------------------------------
# Service: autenticar
# ------------------------------------------------------------

def test_credenciales_correctas_devuelven_token_y_usuario(monkeypatch):
    monkeypatch.setattr(login_service, "obtenerUserCorreo", lambda correo: _usuario())

    resultado = login_service.autenticar("carlos@sgci.com", "123456")

    assert resultado["expira_en"] == 480
    assert resultado["usuario"] == {
        "id_usuario": 1,
        "nombre": "Carlos",
        "correo": "carlos@sgci.com",
        "id_rol": 2,
        "rol": "Jefe de Bodega",
    }

    payload = verificarToken(resultado["token"])
    assert payload["sub"] == "1"
    assert payload["id_rol"] == 2


def test_la_respuesta_nunca_incluye_la_contrasena(monkeypatch):
    monkeypatch.setattr(login_service, "obtenerUserCorreo", lambda correo: _usuario())

    resultado = login_service.autenticar("carlos@sgci.com", "123456")

    assert "password" not in resultado["usuario"]


def test_correo_inexistente_lanza_error(monkeypatch):
    monkeypatch.setattr(login_service, "obtenerUserCorreo", lambda correo: None)

    with pytest.raises(ValueError, match="credenciales son incorrectas"):
        login_service.autenticar("nadie@sgci.com", "123456")


def test_usuario_inactivo_lanza_error(monkeypatch):
    monkeypatch.setattr(
        login_service, "obtenerUserCorreo", lambda correo: _usuario(estado="INACTIVO")
    )

    with pytest.raises(ValueError, match="inactivo"):
        login_service.autenticar("carlos@sgci.com", "123456")


def test_usuario_inactivo_se_rechaza_aunque_la_clave_sea_correcta(monkeypatch):
    # El estado se valida ANTES que la contraseña
    llamado = {"verify": False}

    def verify_falso(*args):
        llamado["verify"] = True
        return True

    monkeypatch.setattr(
        login_service, "obtenerUserCorreo", lambda correo: _usuario(estado="INACTIVO")
    )
    monkeypatch.setattr(login_service.pwdContext, "verify", verify_falso)

    with pytest.raises(ValueError):
        login_service.autenticar("carlos@sgci.com", "123456")

    assert llamado["verify"] is False


def test_contrasena_incorrecta_lanza_error(monkeypatch):
    monkeypatch.setattr(login_service, "obtenerUserCorreo", lambda correo: _usuario())

    with pytest.raises(ValueError, match="Credenciales incorrectas"):
        login_service.autenticar("carlos@sgci.com", "clave-mala")


# ------------------------------------------------------------
# Router: POST /login/
# ------------------------------------------------------------

def test_router_login_correcto_devuelve_200(client, monkeypatch):
    monkeypatch.setattr(
        login_router,
        "autenticar",
        lambda correo, password: {"token": "abc", "expira_en": 480, "usuario": {}},
    )

    respuesta = client.post("/login/", json={"correo": "a@b.com", "password": "x"})

    assert respuesta.status_code == 200
    assert respuesta.json()["token"] == "abc"


def test_router_credenciales_invalidas_devuelve_401(client, monkeypatch):
    def falso(correo, password):
        raise ValueError("Credenciales incorrectas")

    monkeypatch.setattr(login_router, "autenticar", falso)

    respuesta = client.post("/login/", json={"correo": "a@b.com", "password": "x"})

    assert respuesta.status_code == 401
    assert respuesta.json()["detail"] == "Credenciales incorrectas"


def test_router_body_incompleto_devuelve_422(client):
    respuesta = client.post("/login/", json={"correo": "a@b.com"})

    assert respuesta.status_code == 422


# ------------------------------------------------------------
# Repository: obtenerUserCorreo
# ------------------------------------------------------------

def test_repository_convierte_la_fila_en_diccionario(motor_falso):
    fila = Fila(
        id_usuario=1, nombre="Carlos", correo="carlos@sgci.com", password="hash",
        estado="ACTIVO", id_rol=2, rol="Jefe de Bodega",
    )
    motor = motor_falso(login_repository, [[fila]])

    resultado = login_repository.obtenerUserCorreo("carlos@sgci.com")

    assert resultado == {
        "id_usuario": 1, "nombre": "Carlos", "correo": "carlos@sgci.com",
        "password": "hash", "estado": "ACTIVO", "id_rol": 2, "rol": "Jefe de Bodega",
    }
    assert motor.parametros[0] == {"correo": "carlos@sgci.com"}


def test_repository_correo_inexistente_devuelve_none(motor_falso):
    motor_falso(login_repository, [[]])

    assert login_repository.obtenerUserCorreo("nadie@sgci.com") is None
