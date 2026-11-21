# Pruebas unitarias del módulo inventario (service, router y repository).
# Reglas: cantidad > 0, solo ENTRADA/SALIDA, una SALIDA no supera el stock,
# y el indicador de stock bajo (cantidad <= stock_minimo).

import pytest

from app.core import database
from app.modules.inventario import repository as inventario_repository
from app.modules.inventario import router as inventario_router
from app.modules.inventario import service as inventario_service

from tests.unit.bd_falsa import Fila, MotorFalso


@pytest.fixture
def stock_actual(monkeypatch):
    """
    Simula la consulta de stock que hace actualizar_inventario en las SALIDAS.
    Uso: stock_actual(20)  -> hay 20 unidades
         stock_actual(None) -> no existe registro de inventario
    """

    def _configurar(cantidad):
        filas = [] if cantidad is None else [Fila(cantidad=cantidad)]
        motor = MotorFalso([filas])
        # El service importa el engine dentro de la función
        monkeypatch.setattr(database, "engine", motor)
        return motor

    return _configurar


@pytest.fixture
def repo_actualizar(monkeypatch):
    """Reemplaza actualizar_cantidad_inventario y guarda con qué se llamó."""
    llamadas = []

    def _configurar(devuelve):
        def falso(id_bodega, id_material, cantidad, tipo):
            llamadas.append((id_bodega, id_material, cantidad, tipo))
            return devuelve

        monkeypatch.setattr(inventario_service, "actualizar_cantidad_inventario", falso)
        return llamadas

    return _configurar


# ------------------------------------------------------------
# Service: actualizar_inventario
# ------------------------------------------------------------

def test_entrada_valida_suma_al_inventario(repo_actualizar):
    llamadas = repo_actualizar(devuelve=15)

    resultado = inventario_service.actualizar_inventario(1, 2, 5, "ENTRADA")

    assert resultado == {
        "id_bodega": 1,
        "id_material": 2,
        "tipo_movimiento": "ENTRADA",
        "cantidad_movimiento": 5,
        "cantidad_actual": 15,
    }
    assert llamadas == [(1, 2, 5, "ENTRADA")]


@pytest.mark.parametrize("cantidad", [0, -1, -100])
def test_cantidad_cero_o_negativa_se_rechaza(repo_actualizar, cantidad):
    llamadas = repo_actualizar(devuelve=10)

    with pytest.raises(ValueError, match="mayor que cero"):
        inventario_service.actualizar_inventario(1, 2, cantidad, "ENTRADA")

    assert llamadas == []


@pytest.mark.parametrize("tipo", ["TRANSFERENCIA", "entrada", "", "AJUSTE"])
def test_tipo_de_movimiento_invalido_se_rechaza(repo_actualizar, tipo):
    llamadas = repo_actualizar(devuelve=10)

    with pytest.raises(ValueError, match="ENTRADA o SALIDA"):
        inventario_service.actualizar_inventario(1, 2, 5, tipo)

    assert llamadas == []


def test_salida_con_stock_suficiente_se_realiza(stock_actual, repo_actualizar):
    stock_actual(20)
    llamadas = repo_actualizar(devuelve=12)

    resultado = inventario_service.actualizar_inventario(1, 2, 8, "SALIDA")

    assert resultado["cantidad_actual"] == 12
    assert llamadas == [(1, 2, 8, "SALIDA")]


def test_salida_por_exactamente_todo_el_stock_se_permite(stock_actual, repo_actualizar):
    stock_actual(8)
    repo_actualizar(devuelve=0)

    resultado = inventario_service.actualizar_inventario(1, 2, 8, "SALIDA")

    assert resultado["cantidad_actual"] == 0


def test_salida_mayor_al_stock_se_rechaza(stock_actual, repo_actualizar):
    stock_actual(5)
    llamadas = repo_actualizar(devuelve=0)

    with pytest.raises(ValueError, match="supera el inventario disponible"):
        inventario_service.actualizar_inventario(1, 2, 6, "SALIDA")

    # No se debe tocar la base de datos
    assert llamadas == []


def test_salida_sin_registro_de_inventario_se_rechaza(stock_actual, repo_actualizar):
    stock_actual(None)
    llamadas = repo_actualizar(devuelve=0)

    with pytest.raises(ValueError, match="No existe inventario"):
        inventario_service.actualizar_inventario(1, 2, 1, "SALIDA")

    assert llamadas == []


def test_entrada_sin_registro_de_inventario_se_rechaza(repo_actualizar):
    repo_actualizar(devuelve=None)

    with pytest.raises(ValueError, match="No existe inventario"):
        inventario_service.actualizar_inventario(1, 2, 5, "ENTRADA")


# ------------------------------------------------------------
# Service: listar_inventario (H-06)
# ------------------------------------------------------------

def _materiales():
    return [
        {"id_material": 1, "nombre": "Arena", "cantidad": 3, "stock_minimo": 5},
        {"id_material": 2, "nombre": "Cemento", "cantidad": 5, "stock_minimo": 5},
        {"id_material": 3, "nombre": "Varilla", "cantidad": 50, "stock_minimo": 10},
    ]


def test_listar_inventario_marca_stock_bajo(monkeypatch):
    monkeypatch.setattr(
        inventario_service, "obtener_bodega",
        lambda _id: {"id_bodega": 1, "nombre": "Central"},
    )
    monkeypatch.setattr(inventario_service, "obtener_inventario_bodega", lambda _id: _materiales())

    resultado = inventario_service.listar_inventario(1)

    assert resultado["id_bodega"] == 1
    assert resultado["bodega"] == "Central"
    estados = {m["nombre"]: m["stock_bajo"] for m in resultado["materiales"]}
    # Menor al mínimo -> bajo, IGUAL al mínimo -> también bajo, mayor -> normal
    assert estados == {"Arena": True, "Cemento": True, "Varilla": False}


def test_listar_inventario_bodega_inexistente(monkeypatch):
    monkeypatch.setattr(inventario_service, "obtener_bodega", lambda _id: None)

    with pytest.raises(ValueError, match="Bodega no encontrada"):
        inventario_service.listar_inventario(999)


def test_listar_inventario_bodega_vacia(monkeypatch):
    monkeypatch.setattr(
        inventario_service, "obtener_bodega",
        lambda _id: {"id_bodega": 2, "nombre": "Satélite"},
    )
    monkeypatch.setattr(inventario_service, "obtener_inventario_bodega", lambda _id: [])

    assert inventario_service.listar_inventario(2)["materiales"] == []


# ------------------------------------------------------------
# Router
# ------------------------------------------------------------

def test_router_get_inventario_requiere_autenticacion(client):
    assert client.get("/inventario/1").status_code == 401


def test_router_get_inventario_devuelve_200(client, autenticar_como, monkeypatch):
    autenticar_como("Encargado")
    monkeypatch.setattr(
        inventario_router, "listar_inventario",
        lambda id_bodega: {"id_bodega": id_bodega, "bodega": "X", "materiales": []},
    )

    respuesta = client.get("/inventario/4")

    assert respuesta.status_code == 200
    assert respuesta.json()["id_bodega"] == 4


def test_router_get_inventario_bodega_inexistente_devuelve_404(client, autenticar_como, monkeypatch):
    autenticar_como("Encargado")

    def falso(_id):
        raise ValueError("Bodega no encontrada")

    monkeypatch.setattr(inventario_router, "listar_inventario", falso)

    respuesta = client.get("/inventario/999")

    assert respuesta.status_code == 404
    assert respuesta.json()["detail"] == "Bodega no encontrada"


def test_router_put_actualizar_correcto(client, monkeypatch):
    monkeypatch.setattr(
        inventario_router, "actualizar_inventario",
        lambda **datos: {**datos, "cantidad_actual": 10},
    )

    respuesta = client.put(
        "/inventario/actualizar",
        params={"id_bodega": 1, "id_material": 2, "cantidad": 3, "tipo_movimiento": "ENTRADA"},
    )

    assert respuesta.status_code == 200
    assert respuesta.json()["cantidad_actual"] == 10


def test_router_put_actualizar_regla_incumplida_devuelve_400(client, monkeypatch):
    def falso(**datos):
        raise ValueError("La cantidad del movimiento debe ser mayor que cero.")

    monkeypatch.setattr(inventario_router, "actualizar_inventario", falso)

    respuesta = client.put(
        "/inventario/actualizar",
        params={"id_bodega": 1, "id_material": 2, "cantidad": 0, "tipo_movimiento": "ENTRADA"},
    )

    assert respuesta.status_code == 400


# ------------------------------------------------------------
# Repository: actualizar_cantidad_inventario
# ------------------------------------------------------------

def test_repository_entrada_suma_y_actualiza(motor_falso):
    motor = motor_falso(inventario_repository, [[Fila(id_inventario=7, cantidad=10)], []])

    nueva = inventario_repository.actualizar_cantidad_inventario(1, 2, 5, "ENTRADA")

    assert nueva == 15
    assert motor.transacciones == 1
    assert "UPDATE inventario" in motor.sql[1]
    assert motor.parametros[1] == {"nueva_cantidad": 15, "id_inventario": 7}


def test_repository_salida_resta_y_actualiza(motor_falso):
    motor = motor_falso(inventario_repository, [[Fila(id_inventario=7, cantidad=10)], []])

    nueva = inventario_repository.actualizar_cantidad_inventario(1, 2, 4, "SALIDA")

    assert nueva == 6
    assert motor.parametros[1]["nueva_cantidad"] == 6


def test_repository_sin_registro_devuelve_none_y_no_actualiza(motor_falso):
    motor = motor_falso(inventario_repository, [[]])

    assert inventario_repository.actualizar_cantidad_inventario(1, 2, 5, "ENTRADA") is None
    assert len(motor.ejecutadas) == 1


def test_repository_tipo_desconocido_no_actualiza(motor_falso):
    motor = motor_falso(inventario_repository, [[Fila(id_inventario=7, cantidad=10)]])

    assert inventario_repository.actualizar_cantidad_inventario(1, 2, 5, "OTRO") is None
    assert len(motor.ejecutadas) == 1


def test_repository_obtener_bodega(motor_falso):
    fila = Fila(id_bodega=1, nombre="Central", codigo="BC", ubicacion="Nicoya", tipo="CENTRAL")
    motor_falso(inventario_repository, [[fila]])

    assert inventario_repository.obtener_bodega(1)["nombre"] == "Central"


def test_repository_obtener_bodega_inexistente(motor_falso):
    motor_falso(inventario_repository, [[]])

    assert inventario_repository.obtener_bodega(999) is None


def test_repository_inventario_de_bodega(motor_falso):
    fila = Fila(cantidad=3, stock_minimo=5, id_material=1, codigo="M1", nombre="Arena",
                tipo="Agregado", unidad_medida="m3", id_bodega=1, bodega="Central",
                total_entradas=10, total_salidas=7)
    motor = motor_falso(inventario_repository, [[fila]])

    resultado = inventario_repository.obtener_inventario_bodega(1)

    assert resultado[0]["total_entradas"] == 10
    assert resultado[0]["total_salidas"] == 7
    assert motor.parametros[0] == {"id_bodega": 1}
