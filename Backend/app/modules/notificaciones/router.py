# Capa API - notificaciones.

from fastapi import APIRouter, Depends, HTTPException
from app.core.security import getCurrentUser
from app.modules.notificaciones.service import listar_notificaciones

router = APIRouter(
    prefix="/notificaciones",
    tags=["Notificaciones"]
)

@router.get("/")
def obtener_mis_notificaciones(user=Depends(getCurrentUser)):
    try:
        id_usuario = int(user["sub"])
        return listar_notificaciones(id_usuario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))