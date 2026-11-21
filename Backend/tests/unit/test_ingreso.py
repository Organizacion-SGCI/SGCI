# Pruebas unitarias del módulo ingreso / comprobante de ingreso
# (service, router, schemas y repository).

from datetime import datetime

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.modules.ingreso import repository as ingreso_repository
from app.modules.ingreso import router as ingreso_router
from app.modules.ingreso import service as ingreso_service
from app.modules.ingreso.schemas import ComprobanteIngreso

from tests.unit.bd_falsa import Fila


FECHA = datetime(2026, 11, 4, 9, 30)

COMPROBANTE = {
    "id_movimiento": 15,
    "fecha_movimiento": FECHA,
    "proveedor": {"id_proveedor": 2, "nombre": "Ferretería"},
    "responsable": {"id_usuario": 1, "nombre": "Carlos"},
    "materiales": [
        {"id_material": 3, "codigo": "MAT-003", "nombre": "Cemento",
         "unidad_medida": "Saco", "cantidad": 10}
    ],
}


# ------------------------------------------------------------
# Service
# ------------------------------------------------------------

def test_service_devuelve_el_comprobante(monkeypatch):
    monkeypatch.setattr(ingreso_service, "obtener_ingreso", lambda _id: COMPROBANTE)

    assert ingreso_service.obtener_comprobante_ingreso(15) == COMPROBANTE


def test_service_ingreso_inexistente_lanza_404(monkeypatch):
    monkeypatch.setattr(ingreso_service, "obtener_ingreso", lambda _id: None)

    with pytest.raises(HTTPException) as error:
        ingreso_service.obtener_comprobante_ingreso(999)

    assert error.value.status_code == 404
    assert error.value.detail == "Registro de ingreso no encontrado"


# ------------------------------------------------------------
# Router
# ------------------------------------------------------------

def test_router_devuelve_el_comprobante_con_el_formato_del_schema(client, monkeypatch):
    monkeypatch.setattr(ingreso_router, "obtener_comprobante_ingreso", lambda _id: COMPROBANTE)

    respuesta = client.get("/ingresos/15")

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["id_movimiento"] == 15
    assert datos["fecha_movimiento"] == "2026-11-04T09:30:00"
    assert datos["materiales"][0]["codigo"] == "MAT-003"


def test_router_ingreso_inexistente_devuelve_404(client, monkeypatch):
    def falso(_id):
        raise HTTPException(status_code=404, detail="Registro de ingreso no encontrado")

    monkeypatch.setattr(ingreso_router, "obtener_comprobante_ingreso", falso)

    respuesta = client.get("/ingresos/999")

    assert respuesta.status_code == 404


# ------------------------------------------------------------
# Schema
# ------------------------------------------------------------

def test_schema_acepta_un_comprobante_completo():
    comprobante = ComprobanteIngreso(**COMPROBANTE)

    assert comprobante.proveedor.nombre == "Ferretería"
    assert comprobante.materiales[0].cantidad == 10


def test_schema_rechaza_comprobante_sin_proveedor():
    datos = {k: v for k, v in COMPROBANTE.items() if k != "proveedor"}

    with pytest.raises(ValidationError):
        ComprobanteIngreso(**datos)


# ------------------------------------------------------------
# Repository
# ------------------------------------------------------------

def test_repository_arma_el_comprobante_desde_la_fila(motor_falso):
    fila = Fila(
        id_movimiento=15, fecha_movimiento=FECHA, cantidad=10,
        id_material=3, codigo_material="MAT-003", material="Cemento", unidad_medida="Saco",
        id_proveedor=2, proveedor="Ferretería",
        id_usuario=1, responsable="Carlos",
    )
    motor = motor_falso(ingreso_repository, [[fila]])

    assert ingreso_repository.obtener_ingreso(15) == COMPROBANTE
    # Solo debe buscar movimientos de tipo ENTRADA
    assert "mov.tipo = 'ENTRADA'" in motor.sql[0]


def test_repository_movimiento_inexistente_devuelve_none(motor_falso):
    motor_falso(ingreso_repository, [[]])

    assert ingreso_repository.obtener_ingreso(999) is None
