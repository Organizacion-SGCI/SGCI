
# Capa de lógica del módulo de proyectos.

from app.modules.proyectos.repository import obtener_proyectos_activos


def listar_proyectos_activos():
    """Devuelve la lista de proyectos activos del sistema."""
    return obtener_proyectos_activos()