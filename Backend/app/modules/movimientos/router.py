# Capa API.
# Endpoints para registrar movimientos.

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.modules.movimientos.service import registrarEntrada
from app.core.security import getCurrentUser


router = APIRouter(
    prefix="/movimientos",
    tags=["Movimientos"]
)


class EntradaRequest(BaseModel):
    id_material: int
    cantidad: int
    id_bodega: int
    id_proveedor: int
    observacion: str | None = None


@router.post("/entrada")
def crearEntrada(
    datos: EntradaRequest,
    user=Depends(getCurrentUser)
):
    """Registra una entrada de material."""
    try:
        # El id_usuario viene del token
        id_usuario = int(user["sub"])

        return registrarEntrada(
            id_material=datos.id_material,
            cantidad=datos.cantidad,
            id_bodega=datos.id_bodega,
            id_proveedor=datos.id_proveedor,
            id_usuario=id_usuario,
            observacion=datos.observacion
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))