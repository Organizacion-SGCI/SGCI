# Pruebas unitarias del módulo proyectos (service, router y repository).

from app.modules.proyectos import repository as proyectos_repository
from app.modules.proyectos import router as proyectos_router
from app.modules.proyectos import service as proyectos_service

from tests.unit.bd_falsa import Fila


PROYECTOS = [{"id_proyecto": 1, "nombre": "Hotel", "ubicacion": "Nicoya", "estado": "ACTIVO"}]


def test_service_lista_los_proyectos_activos(monkeypatch):
    monkeypatch.setattr(proyectos_service, "obtener_proyectos_activos", lambda: PROYECTOS)

    assert proyectos_service.listar_proyectos_activos() == PROYECTOS


def test_router_requiere_autenticacion(client):
    assert client.get("/proyectos/activos").status_code == 401


def test_router_usuario_autenticado_recibe_los_proyectos(client, autenticar_como, monkeypatch):
    autenticar_como("Encargado")
    monkeypatch.setattr(proyectos_router, "listar_proyectos_activos", lambda: PROYECTOS)

    respuesta = client.get("/proyectos/activos")

    assert respuesta.status_code == 200
    assert respuesta.json() == PROYECTOS


def test_repository_solo_consulta_proyectos_activos(motor_falso):
    motor = motor_falso(proyectos_repository, [[Fila(**PROYECTOS[0])]])

    assert proyectos_repository.obtener_proyectos_activos() == PROYECTOS
    assert "estado = 'ACTIVO'" in motor.sql[0]
