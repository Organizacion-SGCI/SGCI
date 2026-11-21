# Pruebas unitarias del módulo movimientos (registro de ENTRADAS).

from datetime import datetime

import pytest

from app.modules.movimientos import repository as movimientos_repository
from app.modules.movimientos import router as movimientos_router
from app.modules.movimientos import service as movimientos_service

from tests.unit.bd_falsa import Fila


FECHA = datetime(2026, 11, 4, 9, 30)


@pytest.fixture
def dependencias(monkeypatch):
    """Simula material/proveedor existentes, el insert y el inventario."""
    estado = {
        "existe_material": True,
        "existe_proveedor": True,
        "insertados": [],
        "inventario": [],
    }

    monkeypatch.setattr(movimientos_service, "existe_material", lambda _id: estado["existe_material"])
    monkeypatch.setattr(movimientos_service, "existe_proveedor", lambda _id: estado["existe_proveedor"])

    def insertar_falso(**datos):
        estado["insertados"].append(datos)
        return {"id_movimiento": 30, "fecha_movimiento": FECHA}

    def inventario_falso(**datos):
        estado["inventario"].append(datos)
        return {"cantidad_actual": 25}

    monkeypatch.setattr(movimientos_service, "insertar_movimiento", insertar_falso)
    monkeypatch.setattr(movimientos_service, "actualizar_inventario", inventario_falso)
    return estado


# ------------------------------------------------------------
# Service: registrar_entrada
# ------------------------------------------------------------

def test_entrada_valida_registra_movimiento_y_suma_inventario(dependencias):
    resultado = movimientos_service.registrar_entrada(
        id_material=2, cantidad=5, id_bodega=1, id_proveedor=3, id_usuario=9,
        observacion="Compra", precio_unitario=1500.0, num_factura="F-1", num_oc="OC-1",
    )

    assert resultado["id_movimiento"] == 30
    assert resultado["fecha_movimiento"] == str(FECHA)
    assert resultado["tipo"] == "ENTRADA"
    assert resultado["cantidad_actual"] == 25
    assert resultado["num_factura"] == "F-1"

    insertado = dependencias["insertados"][0]
    assert insertado["tipo"] == "ENTRADA"
    # Una entrada llega a la bodega destino y no tiene bodega origen
    assert insertado["id_bodega_origen"] is None
    assert insertado["id_bodega_destino"] == 1
    assert insertado["id_usuario"] == 9

    assert dependencias["inventario"] == [
        {"id_bodega": 1, "id_material": 2, "cantidad": 5, "tipo_movimiento": "ENTRADA"}
    ]


@pytest.mark.parametrize("cantidad", [0, -3])
def test_cantidad_invalida_no_registra_nada(dependencias, cantidad):
    with pytest.raises(ValueError, match="mayor que cero"):
        movimientos_service.registrar_entrada(2, cantidad, 1, 3, 9)

    assert dependencias["insertados"] == []
    assert dependencias["inventario"] == []


def test_material_inexistente_no_registra_nada(dependencias):
    dependencias["existe_material"] = False

    with pytest.raises(ValueError, match="material no existe"):
        movimientos_service.registrar_entrada(2, 5, 1, 3, 9)

    assert dependencias["insertados"] == []


def test_proveedor_inexistente_no_registra_nada(dependencias):
    dependencias["existe_proveedor"] = False

    with pytest.raises(ValueError, match="proveedor no existe"):
        movimientos_service.registrar_entrada(2, 5, 1, 3, 9)

    assert dependencias["insertados"] == []


def test_campos_opcionales_por_defecto_son_none(dependencias):
    resultado = movimientos_service.registrar_entrada(2, 5, 1, 3, 9)

    assert resultado["observacion"] is None
    assert resultado["precio_unitario"] is None
    assert resultado["num_factura"] is None
    assert resultado["num_oc"] is None


# ------------------------------------------------------------
# Router: POST /movimientos/entrada
# ------------------------------------------------------------

BODY = {"id_material": 2, "cantidad": 5, "id_bodega": 1, "id_proveedor": 3}


def test_router_requiere_autenticacion(client):
    assert client.post("/movimientos/entrada", json=BODY).status_code == 401


def test_router_toma_el_usuario_del_token(client, autenticar_como, monkeypatch):
    autenticar_como("Jefe de Bodega", id_usuario=9)
    recibido = {}

    def falso(**datos):
        recibido.update(datos)
        return {"id_movimiento": 1}

    monkeypatch.setattr(movimientos_router, "registrar_entrada", falso)

    respuesta = client.post("/movimientos/entrada", json=BODY)

    assert respuesta.status_code == 200
    assert recibido["id_usuario"] == 9
    assert recibido["cantidad"] == 5
    assert recibido["observacion"] is None


def test_router_regla_incumplida_devuelve_400(client, autenticar_como, monkeypatch):
    autenticar_como("Jefe de Bodega")

    def falso(**datos):
        raise ValueError("El proveedor no existe.")

    monkeypatch.setattr(movimientos_router, "registrar_entrada", falso)

    respuesta = client.post("/movimientos/entrada", json=BODY)

    assert respuesta.status_code == 400
    assert respuesta.json()["detail"] == "El proveedor no existe."


def test_router_body_incompleto_devuelve_422(client, autenticar_como):
    autenticar_como("Jefe de Bodega")

    respuesta = client.post("/movimientos/entrada", json={"id_material": 2})

    assert respuesta.status_code == 422


# ------------------------------------------------------------
# Repository
# ------------------------------------------------------------

def test_repository_insertar_movimiento(motor_falso):
    motor = motor_falso(
        movimientos_repository, [[Fila(id_movimiento=30, fecha_movimiento=FECHA)]]
    )

    resultado = movimientos_repository.insertar_movimiento(
        "ENTRADA", 5, 2, 9, None, 1, 3, "obs"
    )

    assert resultado == {"id_movimiento": 30, "fecha_movimiento": FECHA}
    assert motor.transacciones == 1
    parametros = motor.parametros[0]
    assert parametros["tipo"] == "ENTRADA"
    assert parametros["id_bodega_destino"] == 1
    assert parametros["precio_unitario"] is None


@pytest.mark.parametrize("filas, esperado", [([Fila(id_material=2)], True), ([], False)])
def test_repository_existe_material(motor_falso, filas, esperado):
    motor_falso(movimientos_repository, [filas])

    assert movimientos_repository.existe_material(2) is esperado


@pytest.mark.parametrize("filas, esperado", [([Fila(id_proveedor=3)], True), ([], False)])
def test_repository_existe_proveedor(motor_falso, filas, esperado):
    motor_falso(movimientos_repository, [filas])

    assert movimientos_repository.existe_proveedor(3) is esperado
