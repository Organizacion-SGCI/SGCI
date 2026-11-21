# Pruebas unitarias del diccionario de permisos (app/core/permisos.py)
# y del módulo permisos (service, router y repository) SIN base de datos.
#
# Nota: tests/test_permisos.py (fuera de unit/) es la prueba de integración
# que sí usa PostgreSQL. Esta versión cubre la misma lógica con datos falsos.

import pytest

from app.core.permisos import PERMISOS_POR_ROL
from app.modules.permisos import repository as permisos_repository
from app.modules.permisos import router as permisos_router
from app.modules.permisos import service as permisos_service

from tests.unit.bd_falsa import Fila


# ------------------------------------------------------------
# Diccionario PERMISOS_POR_ROL
# ------------------------------------------------------------

def test_existen_los_cuatro_roles_del_sistema():
    assert set(PERMISOS_POR_ROL) == {
        "Administrador",
        "Jefe de Bodega",
        "Encargado",
        "Jefa de Construcción",
    }


@pytest.mark.parametrize("rol", list(PERMISOS_POR_ROL))
def test_todos_los_roles_pueden_ver_inventario_y_trazabilidad(rol):
    assert "ver_inventario" in PERMISOS_POR_ROL[rol]
    assert "ver_trazabilidad" in PERMISOS_POR_ROL[rol]


def test_solo_el_jefe_de_bodega_aprueba_rechaza_y_transfiere():
    for permiso in ["aprobar_solicitud", "rechazar_solicitud", "transferir_material"]:
        roles = [rol for rol, permisos in PERMISOS_POR_ROL.items() if permiso in permisos]
        assert roles == ["Jefe de Bodega"]


def test_solo_el_encargado_solicita_material_y_confirma_recepcion():
    for permiso in ["solicitar_material", "confirmar_recepcion"]:
        roles = [rol for rol, permisos in PERMISOS_POR_ROL.items() if permiso in permisos]
        assert roles == ["Encargado"]


def test_emitir_vale_es_de_jefe_de_bodega_y_jefa_de_construccion():
    roles = {rol for rol, permisos in PERMISOS_POR_ROL.items() if "emitir_vale" in permisos}
    assert roles == {"Jefe de Bodega", "Jefa de Construcción"}


def test_el_encargado_no_genera_reportes():
    assert "generar_reporte" not in PERMISOS_POR_ROL["Encargado"]


# ------------------------------------------------------------
# Service
# ------------------------------------------------------------

def test_service_devuelve_permisos_ordenados(monkeypatch):
    monkeypatch.setattr(permisos_service, "obtener_rol_usuario", lambda _id: "Encargado")

    resultado = permisos_service.obtener_permisos(4)

    assert resultado["id_usuario"] == 4
    assert resultado["rol"] == "Encargado"
    assert resultado["permisos"] == sorted(PERMISOS_POR_ROL["Encargado"])


def test_service_usuario_inexistente_lanza_value_error(monkeypatch):
    monkeypatch.setattr(permisos_service, "obtener_rol_usuario", lambda _id: None)

    with pytest.raises(ValueError, match="Usuario no encontrado"):
        permisos_service.obtener_permisos(999)


def test_service_rol_desconocido_devuelve_lista_vacia(monkeypatch):
    monkeypatch.setattr(permisos_service, "obtener_rol_usuario", lambda _id: "Visitante")

    assert permisos_service.obtener_permisos(1)["permisos"] == []


# ------------------------------------------------------------
# Router
# ------------------------------------------------------------

def test_router_devuelve_200_con_los_permisos(client, monkeypatch):
    monkeypatch.setattr(
        permisos_router,
        "obtener_permisos",
        lambda id_usuario: {"id_usuario": id_usuario, "rol": "Encargado", "permisos": ["x"]},
    )

    respuesta = client.get("/permisos/2")

    assert respuesta.status_code == 200
    assert respuesta.json() == {"id_usuario": 2, "rol": "Encargado", "permisos": ["x"]}


def test_router_usuario_inexistente_devuelve_404(client, monkeypatch):
    def falso(_id):
        raise ValueError("Usuario no encontrado")

    monkeypatch.setattr(permisos_router, "obtener_permisos", falso)

    respuesta = client.get("/permisos/999")

    assert respuesta.status_code == 404
    assert respuesta.json()["detail"] == "Usuario no encontrado"


def test_router_id_no_numerico_devuelve_422(client):
    assert client.get("/permisos/abc").status_code == 422


# ------------------------------------------------------------
# Repository
# ------------------------------------------------------------

def test_repository_devuelve_el_nombre_del_rol(motor_falso):
    motor = motor_falso(permisos_repository, [[Fila(rol="Jefe de Bodega")]])

    assert permisos_repository.obtener_rol_usuario(3) == "Jefe de Bodega"
    assert motor.parametros[0] == {"id_usuario": 3}


def test_repository_sin_resultado_devuelve_none(motor_falso):
    motor_falso(permisos_repository, [[]])

    assert permisos_repository.obtener_rol_usuario(3) is None
