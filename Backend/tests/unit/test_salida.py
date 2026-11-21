# Pruebas unitarias del módulo salida (H-09: salida de materiales con vale).

from datetime import datetime

import pytest

from app.modules.salida import repository as salida_repository
from app.modules.salida import router as salida_router
from app.modules.salida import service as salida_service

from tests.unit.bd_falsa import Fila


FECHA = datetime(2026, 11, 4, 9, 30)

MATERIAL = {"id_material": 2, "codigo": "MAT-002", "nombre": "Cemento",
            "tipo": "Aglomerante", "unidad_medida": "Saco"}
PROYECTO = {"id_proyecto": 4, "nombre": "Hotel", "ubicacion": "Nicoya", "estado": "ACTIVO"}
USUARIO = {"id_usuario": 9, "nombre": "Carlos", "correo": "carlos@sgci.com"}


@pytest.fixture
def dependencias(monkeypatch):
    estado = {
        "material": MATERIAL,
        "proyecto": PROYECTO,
        "usuario": USUARIO,
        "error_inventario": None,
        "id_movimiento": 7,
        "orden": [],
    }

    monkeypatch.setattr(salida_service, "obtener_material", lambda _id: estado["material"])
    monkeypatch.setattr(salida_service, "obtener_proyecto", lambda _id: estado["proyecto"])
    monkeypatch.setattr(salida_service, "obtener_usuario", lambda _id: estado["usuario"])

    def inventario_falso(**datos):
        estado["orden"].append(("inventario", datos))
        if estado["error_inventario"]:
            raise ValueError(estado["error_inventario"])
        return {"cantidad_actual": 12}

    def movimiento_falso(**datos):
        estado["orden"].append(("movimiento", datos))
        return {"id_movimiento": estado["id_movimiento"], "fecha_movimiento": FECHA}

    monkeypatch.setattr(salida_service, "actualizar_inventario", inventario_falso)
    monkeypatch.setattr(salida_service, "registrar_movimiento_salida", movimiento_falso)
    return estado


def _registrar(**cambios):
    datos = dict(id_usuario=9, id_material=2, cantidad=3, id_bodega_origen=1,
                 id_proyecto=4, observacion="Para columnas")
    datos.update(cambios)
    return salida_service.registrar_salida(**datos)


# ------------------------------------------------------------
# Service: registrar_salida
# ------------------------------------------------------------

def test_salida_valida_genera_el_vale(dependencias):
    resultado = _registrar()

    assert resultado == {
        "id_movimiento": 7,
        "numero_vale": "VALE-2026-007",
        "fecha_movimiento": FECHA,
        "material": "Cemento",
        "codigo_material": "MAT-002",
        "unidad_medida": "Saco",
        "cantidad": 3,
        "id_bodega_origen": 1,
        "proyecto": "Hotel",
        "responsable": "Carlos",
        "cantidad_actual": 12,
        "observacion": "Para columnas",
    }


@pytest.mark.parametrize("id_movimiento, vale", [
    (1, "VALE-2026-001"),
    (45, "VALE-2026-045"),
    (1234, "VALE-2026-1234"),
])
def test_formato_del_numero_de_vale(dependencias, id_movimiento, vale):
    dependencias["id_movimiento"] = id_movimiento

    assert _registrar()["numero_vale"] == vale


def test_primero_descuenta_inventario_y_luego_registra_movimiento(dependencias):
    _registrar()

    pasos = [paso for paso, _ in dependencias["orden"]]
    assert pasos == ["inventario", "movimiento"]
    assert dependencias["orden"][0][1]["tipo_movimiento"] == "SALIDA"


def test_material_inexistente(dependencias):
    dependencias["material"] = None

    with pytest.raises(ValueError, match="material no existe"):
        _registrar()

    assert dependencias["orden"] == []


def test_proyecto_inexistente(dependencias):
    dependencias["proyecto"] = None

    with pytest.raises(ValueError, match="proyecto no existe"):
        _registrar()

    assert dependencias["orden"] == []


def test_usuario_inexistente(dependencias):
    dependencias["usuario"] = None

    with pytest.raises(ValueError, match="usuario no existe"):
        _registrar()

    assert dependencias["orden"] == []


def test_stock_insuficiente_no_registra_movimiento(dependencias):
    dependencias["error_inventario"] = "La cantidad de salida supera el inventario disponible."

    with pytest.raises(ValueError, match="supera el inventario"):
        _registrar(cantidad=999)

    pasos = [paso for paso, _ in dependencias["orden"]]
    assert "movimiento" not in pasos


# ------------------------------------------------------------
# Router: POST /salidas/
# ------------------------------------------------------------

BODY = {"id_material": 2, "cantidad": 3, "id_bodega_origen": 1, "id_proyecto": 4}


def test_router_sin_token_devuelve_401(client):
    assert client.post("/salidas/", json=BODY).status_code == 401


@pytest.mark.parametrize("rol", ["Jefe de Bodega", "Jefa de Construcción"])
def test_router_roles_permitidos(client, autenticar_como, monkeypatch, rol):
    autenticar_como(rol, id_usuario=9)
    recibido = {}

    def falso(**datos):
        recibido.update(datos)
        return {"numero_vale": "VALE-2026-001"}

    monkeypatch.setattr(salida_router, "registrar_salida", falso)

    respuesta = client.post("/salidas/", json=BODY)

    assert respuesta.status_code == 200
    # El responsable sale del token, no del body
    assert recibido["id_usuario"] == 9


@pytest.mark.parametrize("rol", ["Encargado", "Administrador"])
def test_router_roles_no_permitidos_devuelven_403(client, autenticar_como, rol):
    autenticar_como(rol)

    assert client.post("/salidas/", json=BODY).status_code == 403


@pytest.mark.parametrize("campo", ["id_material", "cantidad", "id_bodega_origen", "id_proyecto"])
def test_router_valores_cero_devuelven_422(client, autenticar_como, campo):
    autenticar_como("Jefe de Bodega")

    respuesta = client.post("/salidas/", json={**BODY, campo: 0})

    assert respuesta.status_code == 422


def test_router_regla_de_negocio_devuelve_400(client, autenticar_como, monkeypatch):
    autenticar_como("Jefe de Bodega")

    def falso(**datos):
        raise ValueError("El proyecto no existe en el sistema")

    monkeypatch.setattr(salida_router, "registrar_salida", falso)

    respuesta = client.post("/salidas/", json=BODY)

    assert respuesta.status_code == 400
    assert respuesta.json()["detail"] == "El proyecto no existe en el sistema"


# ------------------------------------------------------------
# Repository
# ------------------------------------------------------------

def test_repository_obtener_material(motor_falso):
    motor_falso(salida_repository, [[Fila(**MATERIAL)]])

    assert salida_repository.obtener_material(2) == MATERIAL


def test_repository_obtener_proyecto(motor_falso):
    motor_falso(salida_repository, [[Fila(**PROYECTO)]])

    assert salida_repository.obtener_proyecto(4) == PROYECTO


def test_repository_obtener_usuario(motor_falso):
    motor_falso(salida_repository, [[Fila(**USUARIO)]])

    assert salida_repository.obtener_usuario(9) == USUARIO


@pytest.mark.parametrize("funcion", ["obtener_material", "obtener_proyecto", "obtener_usuario"])
def test_repository_registros_inexistentes_devuelven_none(motor_falso, funcion):
    motor_falso(salida_repository, [[]])

    assert getattr(salida_repository, funcion)(999) is None


def test_repository_registrar_movimiento_salida(motor_falso):
    motor = motor_falso(
        salida_repository, [[Fila(id_movimiento=7, fecha_movimiento=FECHA)]]
    )

    resultado = salida_repository.registrar_movimiento_salida(2, 3, 9, 1, 4, "obs")

    assert resultado == {"id_movimiento": 7, "fecha_movimiento": FECHA}
    assert "'SALIDA'" in motor.sql[0]
    assert motor.parametros[0]["id_proyecto"] == 4
    assert motor.transacciones == 1
