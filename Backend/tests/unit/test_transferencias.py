# Pruebas unitarias del módulo transferencias (H-10.2).
# El repository hace todo en una transacción: se prueba con un MotorFalso
# que devuelve, en orden, el resultado de cada consulta.

from datetime import datetime

import pytest

from app.modules.transferencias import repository as transferencias_repository
from app.modules.transferencias import router as transferencias_router
from app.modules.transferencias import service as transferencias_service
from app.modules.transferencias.repository import (
    SinPermisoTransferencia,
    SolicitudNoEncontrada,
    TransferenciaInvalida,
)

from tests.unit.bd_falsa import Fila


FECHA = datetime(2026, 11, 4, 9, 30)


def _solicitud(estado="APROBADA"):
    # bodega_destino de la solicitud (1) es la que SURTE el material
    return Fila(
        id_solicitud=5, estado=estado, id_usuario=3,
        id_bodega_origen=2, id_bodega_destino=1,
        bodega_salida="Central", bodega_recepcion="Satélite",
    )


MATERIALES = [
    Fila(id_material=10, nombre="Cemento", cantidad=4),
    Fila(id_material=11, nombre="Arena", cantidad=2),
]


# ------------------------------------------------------------
# Repository: ejecutar_transferencia
# ------------------------------------------------------------

def test_transferencia_completa(motor_falso):
    motor = motor_falso(transferencias_repository, [
        [_solicitud()],                              # 1. solicitud (FOR UPDATE)
        [Fila(uno=1)],                               # 2. el usuario pertenece
        MATERIALES,                                  # 4. materiales
        [Fila(id_inventario=100, cantidad=10)],      # 5. stock cemento
        [Fila(id_inventario=101, cantidad=2)],       # 5. stock arena (exacto)
        [Fila(cantidad=6)], [],                      # 6. update + movimiento cemento
        [Fila(cantidad=0)], [],                      # 6. update + movimiento arena
        [Fila(id_pedido=8, fecha_pedido=FECHA)],     # 7. pedido
        [],                                          # 7. solicitud EN_TRANSITO
    ])

    resultado = transferencias_repository.ejecutar_transferencia(5, id_usuario=4)

    assert resultado == {
        "id_pedido": 8,
        "fecha_pedido": FECHA,
        "id_solicitud": 5,
        "bodega_salida": "Central",
        "bodega_recepcion": "Satélite",
        "materiales": [
            {"id_material": 10, "nombre": "Cemento", "cantidad": 4, "stock_salida_actual": 6},
            {"id_material": 11, "nombre": "Arena", "cantidad": 2, "stock_salida_actual": 0},
        ],
    }
    # Todo dentro de UNA transacción
    assert motor.transacciones == 1

    # El permiso se revisa sobre la bodega que surte (destino de la solicitud)
    assert motor.parametros[1] == {"id_usuario": 4, "id_bodega": 1}

    # Movimiento físico: central (1) -> satélite (2)
    movimiento = motor.parametros[6]
    assert movimiento["id_bodega_origen"] == 1
    assert movimiento["id_bodega_destino"] == 2
    assert "'TRANSFERENCIA'" in motor.sql[6]
    assert "EN_TRANSITO" in motor.sql[-1]


def test_solicitud_inexistente(motor_falso):
    motor_falso(transferencias_repository, [[]])

    with pytest.raises(SolicitudNoEncontrada):
        transferencias_repository.ejecutar_transferencia(5, 4)


def test_usuario_de_otra_bodega_no_puede_transferir(motor_falso):
    motor = motor_falso(transferencias_repository, [[_solicitud()], []])

    with pytest.raises(SinPermisoTransferencia):
        transferencias_repository.ejecutar_transferencia(5, 4)

    assert len(motor.ejecutadas) == 2


@pytest.mark.parametrize("estado", ["PENDIENTE", "RECHAZADA", "EN_TRANSITO", "COMPLETADA"])
def test_solo_se_transfieren_aprobadas(motor_falso, estado):
    motor_falso(transferencias_repository, [[_solicitud(estado)], [Fila(uno=1)]])

    with pytest.raises(TransferenciaInvalida, match="aprobadas"):
        transferencias_repository.ejecutar_transferencia(5, 4)


def test_solicitud_sin_materiales(motor_falso):
    motor_falso(transferencias_repository, [[_solicitud()], [Fila(uno=1)], []])

    with pytest.raises(TransferenciaInvalida, match="no tiene materiales"):
        transferencias_repository.ejecutar_transferencia(5, 4)


def test_stock_insuficiente_reporta_todos_los_faltantes_y_no_modifica(motor_falso):
    motor = motor_falso(transferencias_repository, [
        [_solicitud()],
        [Fila(uno=1)],
        MATERIALES,
        [Fila(id_inventario=100, cantidad=1)],   # cemento: hay 1, piden 4
        [],                                      # arena: no hay registro
    ])

    with pytest.raises(TransferenciaInvalida) as error:
        transferencias_repository.ejecutar_transferencia(5, 4)

    mensaje = str(error.value)
    assert "Cemento (disponible 1, solicitado 4)" in mensaje
    assert "Arena (disponible 0, solicitado 2)" in mensaje
    # Solo se ejecutaron las 5 lecturas: ningún UPDATE ni INSERT
    assert len(motor.ejecutadas) == 5
    assert not any("UPDATE inventario" in sql or "INSERT INTO" in sql for sql in motor.sql)


def test_transferencia_invalida_es_un_value_error():
    # El router la traduce a 400 igual que los demás errores de negocio
    assert issubclass(TransferenciaInvalida, ValueError)


# ------------------------------------------------------------
# Service
# ------------------------------------------------------------

def test_service_devuelve_el_pedido_en_transito(monkeypatch):
    monkeypatch.setattr(
        transferencias_service, "ejecutar_transferencia",
        lambda id_s, id_u: {
            "id_pedido": 8, "id_solicitud": id_s, "fecha_pedido": FECHA,
            "bodega_salida": "Central", "bodega_recepcion": "Satélite", "materiales": [],
        },
    )

    resultado = transferencias_service.confirmar_transferencia(id_usuario=4, id_solicitud=5)

    assert resultado == {
        "id_pedido": 8,
        "id_solicitud": 5,
        "estado": "EN_TRANSITO",
        "fecha_pedido": "2026-11-04T09:30:00",
        "bodega_salida": "Central",
        "bodega_recepcion": "Satélite",
        "materiales": [],
    }


def test_service_propaga_los_errores_del_repository(monkeypatch):
    def falso(id_s, id_u):
        raise TransferenciaInvalida("Solo se pueden transferir solicitudes aprobadas.")

    monkeypatch.setattr(transferencias_service, "ejecutar_transferencia", falso)

    with pytest.raises(TransferenciaInvalida):
        transferencias_service.confirmar_transferencia(4, 5)


# ------------------------------------------------------------
# Router: POST /transferencias/
# ------------------------------------------------------------

def test_router_solo_jefe_de_bodega(client, autenticar_como):
    autenticar_como("Encargado")

    assert client.post("/transferencias/", json={"id_solicitud": 5}).status_code == 403


def test_router_transferencia_correcta(client, autenticar_como, monkeypatch):
    autenticar_como("Jefe de Bodega", id_usuario=4)
    recibido = {}

    def falso(**datos):
        recibido.update(datos)
        return {"id_pedido": 8, "estado": "EN_TRANSITO"}

    monkeypatch.setattr(transferencias_router, "confirmar_transferencia", falso)

    respuesta = client.post("/transferencias/", json={"id_solicitud": 5})

    assert respuesta.status_code == 200
    assert recibido == {"id_usuario": 4, "id_solicitud": 5}


@pytest.mark.parametrize("error, codigo", [
    (SolicitudNoEncontrada("La solicitud no existe."), 404),
    (SinPermisoTransferencia("Solo el Jefe de la bodega que surte la solicitud puede transferirla."), 403),
    (TransferenciaInvalida("Stock insuficiente en la bodega de salida: X."), 400),
])
def test_router_traduce_errores(client, autenticar_como, monkeypatch, error, codigo):
    autenticar_como("Jefe de Bodega")

    def falso(**datos):
        raise error

    monkeypatch.setattr(transferencias_router, "confirmar_transferencia", falso)

    respuesta = client.post("/transferencias/", json={"id_solicitud": 5})

    assert respuesta.status_code == codigo
    assert respuesta.json()["detail"] == str(error)


def test_router_id_solicitud_invalido_devuelve_422(client, autenticar_como):
    autenticar_como("Jefe de Bodega")

    assert client.post("/transferencias/", json={"id_solicitud": 0}).status_code == 422
