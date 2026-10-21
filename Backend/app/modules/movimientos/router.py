# Capa API - endpoints de movimientos.

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.modules.movimientos.service import registrar_entrada
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
    precio_unitario: float | None = None
    num_factura: str | None = None
    num_oc: str | None = None


@router.post("/entrada")
def crear_entrada(datos: EntradaRequest, user=Depends(getCurrentUser)):
    """Registra una entrada de material."""
    try:
        id_usuario = int(user["sub"])
        return registrar_entrada(
            id_material=datos.id_material,
            cantidad=datos.cantidad,
            id_bodega=datos.id_bodega,
            id_proveedor=datos.id_proveedor,
            id_usuario=id_usuario,
            observacion=datos.observacion,
            precio_unitario=datos.precio_unitario,
            num_factura=datos.num_factura,
            num_oc=datos.num_oc
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))