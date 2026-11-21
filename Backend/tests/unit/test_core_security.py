# Pruebas unitarias de app/core/security.py
# Generación y verificación de tokens JWT y la dependency getCurrentUser.

from datetime import datetime, timedelta, timezone

from jose import jwt

from app.core import security
from app.core.security import ALGORITHM, crearToken, verificarToken
from app.modules.proyectos import router as proyectos_router


def test_crear_token_incluye_usuario_rol_y_expiracion():
    token = crearToken(id_usuario=7, id_rol=2)

    payload = jwt.decode(token, security.SECRET_KEY, algorithms=[ALGORITHM])

    # El id de usuario viaja como texto en "sub" (estándar JWT)
    assert payload["sub"] == "7"
    assert payload["id_rol"] == 2
    assert "exp" in payload


def test_crear_token_expira_segun_la_configuracion():
    antes = datetime.now(timezone.utc)
    token = crearToken(id_usuario=1, id_rol=1)

    payload = jwt.decode(token, security.SECRET_KEY, algorithms=[ALGORITHM])
    expira = datetime.fromtimestamp(payload["exp"], timezone.utc)

    esperado = antes + timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Margen de unos segundos por el tiempo de ejecución
    assert abs((expira - esperado).total_seconds()) < 5


def test_verificar_token_valido_devuelve_payload():
    token = crearToken(id_usuario=3, id_rol=4)

    payload = verificarToken(token)

    assert payload is not None
    assert payload["sub"] == "3"
    assert payload["id_rol"] == 4


def test_verificar_token_con_texto_invalido_devuelve_none():
    assert verificarToken("esto-no-es-un-jwt") is None


def test_verificar_token_firmado_con_otra_clave_devuelve_none():
    token_ajeno = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        "otra-clave-distinta",
        algorithm=ALGORITHM,
    )

    assert verificarToken(token_ajeno) is None


def test_verificar_token_expirado_devuelve_none():
    token_vencido = jwt.encode(
        {"sub": "1", "id_rol": 1, "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        security.SECRET_KEY,
        algorithm=ALGORITHM,
    )

    assert verificarToken(token_vencido) is None


# ------------------------------------------------------------
# getCurrentUser (se prueba a través de un endpoint protegido)
# ------------------------------------------------------------

def test_endpoint_protegido_sin_token_devuelve_401(client):
    respuesta = client.get("/proyectos/activos")

    assert respuesta.status_code == 401


def test_endpoint_protegido_con_token_invalido_devuelve_401(client):
    respuesta = client.get(
        "/proyectos/activos",
        headers={"Authorization": "Bearer token-falso"},
    )

    assert respuesta.status_code == 401
    assert respuesta.json()["detail"] == "Token inválido o expirado"


def test_endpoint_protegido_con_token_valido_deja_pasar(client, monkeypatch):
    monkeypatch.setattr(proyectos_router, "listar_proyectos_activos", lambda: [])
    token = crearToken(id_usuario=1, id_rol=1)

    respuesta = client.get(
        "/proyectos/activos",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert respuesta.status_code == 200
    assert respuesta.json() == []
