# Capa API - endpoints de solicitudes.

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.modules.solicitudes.service import registrar_solicitud, obtener_solicitudes
from app.core.security import getCurrentUser
from app.core.dependencies import require_rol


router = APIRouter(
    prefix="/solicitudes",
    tags=["Solicitudes"]
)


class material_solicitud(BaseModel):
    id_material: int = Field(..., gt=0)
    cantidad: int = Field(..., gt=0)


class solicitud_request(BaseModel):
    id_bodega_origen: int = Field(..., gt=0)
    id_bodega_destino: int = Field(..., gt=0)
    prioridad: str = "MEDIA"
    materiales: list[material_solicitud]


@router.post("/")
def crear_solicitud_endpoint(
    datos: solicitud_request,
    user=Depends(getCurrentUser)
):
    #Registra una nueva solicitud de materiales
    try:
        id_usuario = int(user["sub"])

        materiales_dict = [
            {"id_material": m.id_material, "cantidad": m.cantidad}
            for m in datos.materiales
        ]

        return registrar_solicitud(
            id_usuario=id_usuario,
            id_bodega_origen=datos.id_bodega_origen,
            id_bodega_destino=datos.id_bodega_destino,
            prioridad=datos.prioridad,
            materiales=materiales_dict
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
def listar_solicitudes_endpoint(
    estado: str | None = None,
    usuario_actual: dict = Depends(
        require_rol(["Jefe de Bodega", "Encargado"])
    )
):
    #H-05.1: lista las solicitudes segun el rol
    try:
        return obtener_solicitudes(
            id_usuario=usuario_actual["id_usuario"],
            rol=usuario_actual["rol"],
            estado=estado
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))