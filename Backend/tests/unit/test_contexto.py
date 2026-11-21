# Pruebas unitarias del módulo contexto (service, router y repository).

from app.modules.contexto import repository as contexto_repository
from app.modules.contexto import router as contexto_router
from app.modules.contexto import service as contexto_service

from tests.unit.bd_falsa import Fila


def test_service_junta_bodegas_y_proyectos_del_usuario(monkeypatch):
    llamadas = []

    def bodegas(id_usuario):
        llamadas.append(("bodegas", id_usuario))
        return [{"id_bodega": 1}]

    def proyectos(id_usuario):
        llamadas.append(("proyectos", id_usuario))
        return [{"id_proyecto": 9}]

    monkeypatch.setattr(contexto_service, "obtener_bodegas_usuario", bodegas)
    monkeypatch.setattr(contexto_service, "obtener_proyectos_usuario", proyectos)

    resultado = contexto_service.obtener_contextos(5)

    assert resultado == {"bodegas": [{"id_bodega": 1}], "proyectos": [{"id_proyecto": 9}]}
    assert llamadas == [("bodegas", 5), ("proyectos", 5)]


def test_service_usuario_sin_asignaciones_devuelve_listas_vacias(monkeypatch):
    monkeypatch.setattr(contexto_service, "obtener_bodegas_usuario", lambda _id: [])
    monkeypatch.setattr(contexto_service, "obtener_proyectos_usuario", lambda _id: [])

    assert contexto_service.obtener_contextos(5) == {"bodegas": [], "proyectos": []}


def test_router_get_contextos_devuelve_200(client, monkeypatch):
    monkeypatch.setattr(
        contexto_router,
        "obtener_contextos",
        lambda id_usuario: {"bodegas": [], "proyectos": [], "id": id_usuario},
    )

    respuesta = client.get("/contextos/3")

    assert respuesta.status_code == 200
    assert respuesta.json()["id"] == 3


def test_router_id_no_numerico_devuelve_422(client):
    assert client.get("/contextos/abc").status_code == 422


def test_repository_bodegas_del_usuario(motor_falso):
    fila = Fila(id_bodega=1, nombre="Central", codigo="BC", ubicacion="Nicoya", tipo="CENTRAL")
    motor = motor_falso(contexto_repository, [[fila]])

    resultado = contexto_repository.obtener_bodegas_usuario(5)

    assert resultado == [
        {"id_bodega": 1, "nombre": "Central", "codigo": "BC", "ubicacion": "Nicoya", "tipo": "CENTRAL"}
    ]
    assert motor.parametros[0] == {"id_usuario": 5}
    assert "usuario_bodega" in motor.sql[0]


def test_repository_proyectos_del_usuario(motor_falso):
    fila = Fila(id_proyecto=2, nombre="Hotel", ubicacion="Guanacaste", estado="ACTIVO")
    motor = motor_falso(contexto_repository, [[fila]])

    resultado = contexto_repository.obtener_proyectos_usuario(5)

    assert resultado == [
        {"id_proyecto": 2, "nombre": "Hotel", "ubicacion": "Guanacaste", "estado": "ACTIVO"}
    ]
    assert "usuario_proyecto" in motor.sql[0]
