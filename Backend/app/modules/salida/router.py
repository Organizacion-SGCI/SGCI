# Capa de presentación del módulo de salida.
#Expone el endpoint POST /salidas/ que permite registrar
# la salida de materiales mediante un vale único.
# Protegido por rol: solo Jefe de Bodega y Jefa de Construcción

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.dependencies import require_rol
from app.modules.salida.service import registrar_salida


# Router encargado de las operaciones de salida de materiales.
router = APIRouter(
    prefix="/salidas",
    tags=["Salidas"]
)


class SalidaRequest(BaseModel):
    """Esquema del body para registrar una salida de materiales."""
    id_material: int = Field(..., gt=0)
    cantidad: int = Field(..., gt=0)
    id_bodega_origen: int = Field(..., gt=0)
    id_proyecto: int = Field(..., gt=0)
    observacion: str | None = None


@router.post("/")
def crear_salida(
    datos: SalidaRequest,
    usuario_actual: dict = Depends(
        require_rol(["Jefe de Bodega", "Jefa de Construcción"])
    )
):
    """
    Registra la salida de materiales y genera el vale correspondiente.

    El usuario responsable se obtiene del JWT (no del body).
    Los roles permitidos son Jefe de Bodega y Jefa de Construcción.
    """
    try:
        return registrar_salida(
            id_usuario=usuario_actual["id_usuario"],
            id_material=datos.id_material,
            cantidad=datos.cantidad,
            id_bodega_origen=datos.id_bodega_origen,
            id_proyecto=datos.id_proyecto,
            observacion=datos.observacion
        )

    except ValueError as error:
        # Si alguna regla de negocio falla, devolvemos 400.
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )