# Capa API - endpoints de solicitudes.

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.core.security import getCurrentUser
from app.core.dependencies import require_rol
from app.modules.solicitudes.service import (
    registrar_solicitud,
    obtener_solicitudes,
    cambiar_estado_solicitud,
    agregar_materiales_a_solicitud,
    SolicitudNoEncontrada,
    SinPermisoSobreSolicitud
)

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

class RechazoRequest(BaseModel):
    motivo: str | None = None


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

@router.put("/{id_solicitud}/aprobar")
def aprobar_solicitud_endpoint(
    id_solicitud: int,
    usuario_actual: dict = Depends(require_rol(["Jefe de Bodega"]))
):
    try:
        return cambiar_estado_solicitud(id_solicitud, "APROBADA")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{id_solicitud}/rechazar")
def rechazar_solicitud_endpoint(
    id_solicitud: int,
    datos: RechazoRequest,
    usuario_actual: dict = Depends(require_rol(["Jefe de Bodega"]))
):
    try:
        return cambiar_estado_solicitud(id_solicitud, "RECHAZADA", datos.motivo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



class agregar_materiales_request(BaseModel):
    materiales: list[material_solicitud]

@router.post("/{id_solicitud}/materiales")
def agregar_materiales_endpoint(
    id_solicitud: int,
    datos: agregar_materiales_request,
    usuario_actual: dict = Depends(require_rol(["Encargado"]))
):
    #H-04.1: agrega materiales al listado de una solicitud pendiente
    try:
        materiales_dict = [
            {"id_material": m.id_material, "cantidad": m.cantidad}
            for m in datos.materiales
        ]

        return agregar_materiales_a_solicitud(
            id_usuario=usuario_actual["id_usuario"],
            id_solicitud=id_solicitud,
            materiales=materiales_dict
        )
    except SolicitudNoEncontrada as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SinPermisoSobreSolicitud as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))