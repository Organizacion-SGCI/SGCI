# Herramientas compartidas por las pruebas unitarias.

# Las pruebas unitarias NO usan PostgreSQL:
#   - Para probar services se reemplazan (monkeypatch) las funciones del
#     repository que usa cada service.
#   - Para probar routers se usa TestClient y se reemplaza la autenticación
#     (getCurrentUser) y la consulta de permisos (obtener_permisos).

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core import dependencies
from app.core.security import getCurrentUser

from tests.unit.bd_falsa import MotorFalso


@pytest.fixture
def motor_falso(monkeypatch):
    """
    Uso:
        motor = motor_falso(repository, [[Fila(...)], []])
    Reemplaza repository.engine por un MotorFalso y lo devuelve.
    """

    def _crear(modulo, respuestas=None):
        motor = MotorFalso(respuestas)
        monkeypatch.setattr(modulo, "engine", motor)
        return motor

    return _crear


# ============================================================
# Cliente HTTP y autenticación simulada
# ============================================================

@pytest.fixture
def client():
    with TestClient(app) as cliente:
        yield cliente
    app.dependency_overrides.clear()


@pytest.fixture
def autenticar_como(monkeypatch):
    """
    Simula un usuario logueado sin token real ni base de datos.

    Uso:
        autenticar_como("Jefe de Bodega", id_usuario=3)

    - getCurrentUser devuelve un payload como el del JWT.
    - require_rol consulta un rol falso en lugar de la base de datos,
      así se prueba la validación de roles real.
    """

    def _autenticar(rol, id_usuario=1, permisos=None):
        payload = {"sub": str(id_usuario), "id_rol": 1}
        app.dependency_overrides[getCurrentUser] = lambda: payload

        monkeypatch.setattr(
            dependencies,
            "obtener_permisos",
            lambda id_usr: {
                "id_usuario": id_usr,
                "rol": rol,
                "permisos": permisos or [],
            },
        )
        return payload

    yield _autenticar
    app.dependency_overrides.clear()
