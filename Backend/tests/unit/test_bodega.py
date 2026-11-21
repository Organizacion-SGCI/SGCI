# Pruebas unitarias del módulo bodega (service, router y repository).

from app.modules.bodega import repository as bodega_repository
from app.modules.bodega import router as bodega_router
from app.modules.bodega import service as bodega_service

from tests.unit.bd_falsa import Fila


BODEGAS = [
    {"id_bodega": 1, "nombre": "Central", "codigo": "BC", "tipo": "CENTRAL", "ubicacion": "Nicoya"},
    {"id_bodega": 2, "nombre": "Satélite", "codigo": "BS", "tipo": "SATELITE", "ubicacion": "Liberia"},
]


def test_service_devuelve_lo_que_entrega_el_repository(monkeypatch):
    monkeypatch.setattr(bodega_service, "obtener_bodegas", lambda: BODEGAS)

    assert bodega_service.listar_bodegas() == BODEGAS


def test_router_get_bodegas_devuelve_200(client, monkeypatch):
    monkeypatch.setattr(bodega_router, "listar_bodegas", lambda: BODEGAS)

    respuesta = client.get("/bodegas/")

    assert respuesta.status_code == 200
    assert respuesta.json() == BODEGAS


def test_repository_convierte_cada_fila_en_diccionario(motor_falso):
    motor = motor_falso(bodega_repository, [[Fila(**b) for b in BODEGAS]])

    assert bodega_repository.obtener_bodegas() == BODEGAS
    assert "ORDER BY id_bodega" in motor.sql[0]


def test_repository_sin_bodegas_devuelve_lista_vacia(motor_falso):
    motor_falso(bodega_repository, [[]])

    assert bodega_repository.obtener_bodegas() == []
