
# Expone el endpoint GET /proyectos/activos.
# Requiere autenticación (cualquier usuario logueado puede consultarlo).

from fastapi import APIRouter, Depends

from app.core.security import getCurrentUser
from app.modules.proyectos.service import listar_proyectos_activos


router = APIRouter(
    prefix="/proyectos",
    tags=["Proyectos"]
)


@router.get("/activos")
def obtener_activos(payload: dict = Depends(getCurrentUser)):
    """Devuelve todos los proyectos activos. Requiere autenticación."""
    return listar_proyectos_activos()