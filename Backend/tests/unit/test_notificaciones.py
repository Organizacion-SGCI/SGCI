# Pruebas unitarias del módulo notificaciones (service, router y repository).

from datetime import datetime

import pytest

from app.modules.notificaciones import repository as notificaciones_repository
from app.modules.notificaciones import router as notificaciones_router
from app.modules.notificaciones import service as notificaciones_service

from tests.unit.bd_falsa import Fila


# ------------------------------------------------------------
# Service
# ------------------------------------------------------------

@pytest.mark.parametrize("tipo", ["SOLICITUD", "CAMBIO_ESTADO", "STOCK_BAJO"])
def test_registrar_notificacion_con_tipo_valido(monkeypatch, tipo):
    recibido = {}

    def crear_falso(titulo, mensaje, tipo, id_usuario):
        recibido.update(titulo=titulo, mensaje=mensaje, tipo=tipo, id_usuario=id_usuario)
        return {"id_notificacion": 10}

    monkeypatch.setattr(notificaciones_service, "crear_notificacion", crear_falso)

    resultado = notificaciones_service.registrar_notificacion("T", "M", tipo, 4)

    assert resultado == {"id_notificacion": 10}
    assert recibido == {"titulo": "T", "mensaje": "M", "tipo": tipo, "id_usuario": 4}


@pytest.mark.parametrize("tipo", ["OTRO", "solicitud", "", None])
def test_registrar_notificacion_con_tipo_invalido_no_guarda(monkeypatch, tipo):
    def no_deberia_llamarse(*args):
        raise AssertionError("No debía guardar la notificación")

    monkeypatch.setattr(notificaciones_service, "crear_notificacion", no_deberia_llamarse)

    with pytest.raises(ValueError, match="Tipo de notificación inválido"):
        notificaciones_service.registrar_notificacion("T", "M", tipo, 4)


def test_listar_notificaciones_del_usuario(monkeypatch):
    monkeypatch.setattr(
        notificaciones_service,
        "obtener_notificaciones_usuario",
        lambda id_usuario: [{"id_notificacion": 1, "id_usuario": id_usuario}],
    )

    assert notificaciones_service.listar_notificaciones(8) == [
        {"id_notificacion": 1, "id_usuario": 8}
    ]


# ------------------------------------------------------------
# Router: GET /notificaciones/
# ------------------------------------------------------------

def test_router_requiere_autenticacion(client):
    assert client.get("/notificaciones/").status_code == 401


def test_router_usa_el_id_del_token(client, autenticar_como, monkeypatch):
    autenticar_como("Encargado", id_usuario=12)
    recibido = {}

    def listar_falso(id_usuario):
        recibido["id"] = id_usuario
        return []

    monkeypatch.setattr(notificaciones_router, "listar_notificaciones", listar_falso)

    respuesta = client.get("/notificaciones/")

    assert respuesta.status_code == 200
    assert respuesta.json() == []
    assert recibido["id"] == 12


def test_router_token_con_id_no_numerico_devuelve_400(client):
    from app.main import app
    from app.core.security import getCurrentUser

    app.dependency_overrides[getCurrentUser] = lambda: {"sub": "abc"}

    respuesta = client.get("/notificaciones/")

    assert respuesta.status_code == 400


# ------------------------------------------------------------
# Repository
# ------------------------------------------------------------

def test_repository_crear_notificacion_usa_transaccion(motor_falso):
    fecha = datetime(2026, 11, 1, 10, 0)
    motor = motor_falso(
        notificaciones_repository,
        [[Fila(id_notificacion=5, fecha_creacion=fecha)]],
    )

    resultado = notificaciones_repository.crear_notificacion("T", "M", "SOLICITUD", 3)

    assert resultado == {"id_notificacion": 5, "fecha_creacion": fecha}
    assert motor.transacciones == 1
    assert motor.parametros[0] == {
        "titulo": "T", "mensaje": "M", "tipo": "SOLICITUD", "id_usuario": 3
    }


def test_repository_obtener_notificaciones_ordenadas(motor_falso):
    filas = [
        Fila(id_notificacion=2, titulo="B", mensaje="", tipo="SOLICITUD",
             fecha_creacion=None, leida=False),
        Fila(id_notificacion=1, titulo="A", mensaje="", tipo="SOLICITUD",
             fecha_creacion=None, leida=True),
    ]
    motor = motor_falso(notificaciones_repository, [filas])

    resultado = notificaciones_repository.obtener_notificaciones_usuario(3)

    assert [n["id_notificacion"] for n in resultado] == [2, 1]
    assert "ORDER BY fecha_creacion DESC" in motor.sql[0]
