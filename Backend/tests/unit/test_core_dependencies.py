# Pruebas unitarias de app/core/dependencies.py (require_rol)
# Se llama directamente a la función interna "verificar" para no depender
# de ningún endpoint ni de la base de datos.

import pytest
from fastapi import HTTPException

from app.core import dependencies
from app.core.dependencies import require_rol


def _simular_permisos(monkeypatch, rol=None, error=None):
    def falso(id_usuario):
        if error:
            raise error
        return {"id_usuario": id_usuario, "rol": rol, "permisos": ["ver_inventario"]}

    monkeypatch.setattr(dependencies, "obtener_permisos", falso)


def test_rol_permitido_devuelve_payload_enriquecido(monkeypatch):
    _simular_permisos(monkeypatch, rol="Jefe de Bodega")
    verificar = require_rol(["Jefe de Bodega", "Jefa de Construcción"])

    resultado = verificar({"sub": "5", "id_rol": 2})

    assert resultado["id_usuario"] == 5
    assert resultado["rol"] == "Jefe de Bodega"
    assert resultado["permisos"] == ["ver_inventario"]
    # Conserva los datos originales del JWT
    assert resultado["sub"] == "5"
    assert resultado["id_rol"] == 2


def test_rol_no_permitido_lanza_403(monkeypatch):
    _simular_permisos(monkeypatch, rol="Encargado")
    verificar = require_rol(["Jefe de Bodega"])

    with pytest.raises(HTTPException) as error:
        verificar({"sub": "5", "id_rol": 3})

    assert error.value.status_code == 403
    assert error.value.detail == "No tiene permiso para realizar esta acción"


def test_usuario_inexistente_lanza_401(monkeypatch):
    _simular_permisos(monkeypatch, error=ValueError("Usuario no encontrado"))
    verificar = require_rol(["Jefe de Bodega"])

    with pytest.raises(HTTPException) as error:
        verificar({"sub": "999", "id_rol": 1})

    assert error.value.status_code == 401
    assert error.value.detail == "Usuario no válido"


def test_lista_de_roles_vacia_no_deja_pasar_a_nadie(monkeypatch):
    _simular_permisos(monkeypatch, rol="Administrador")
    verificar = require_rol([])

    with pytest.raises(HTTPException) as error:
        verificar({"sub": "1", "id_rol": 1})

    assert error.value.status_code == 403


def test_cada_llamada_crea_una_dependency_independiente():
    # require_rol es una "fábrica": cada endpoint recibe su propia función
    assert require_rol(["A"]) is not require_rol(["A"])
