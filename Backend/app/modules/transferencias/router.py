# Capa API - endpoints de transferencias.
# H-10.2: POST /transferencias/ confirma la transferencia de una solicitud
# aprobada. Solo el Jefe de Bodega puede usarlo.

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.core.dependencies import require_rol
from app.modules.transferencias.service import confirmar_transferencia
from app.modules.transferencias.repository import (
    SolicitudNoEncontrada,
    SinPermisoTransferencia,
    TransferenciaInvalida
)


router = APIRouter(
    prefix="/transferencias",
    tags=["Transferencias"]
)


class TransferenciaRequest(BaseModel):
    id_solicitud: int = Field(..., gt=0)


@router.post("/")
def confirmar_transferencia_endpoint(
    datos: TransferenciaRequest,
    usuario_actual: dict = Depends(require_rol(["Jefe de Bodega"]))
):
    # H-10.2: transfiere los materiales de una solicitud aprobada
    try:
        return confirmar_transferencia(
            id_usuario=usuario_actual["id_usuario"],
            id_solicitud=datos.id_solicitud
        )
    except SolicitudNoEncontrada as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SinPermisoTransferencia as e:
        raise HTTPException(status_code=403, detail=str(e))
    except TransferenciaInvalida as e:
        raise HTTPException(status_code=400, detail=str(e))