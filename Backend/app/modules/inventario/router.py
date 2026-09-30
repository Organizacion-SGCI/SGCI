# Capa API.
# Aquí se definen los endpoints que pueden ser llamados
# desde el frontend u otros módulos del backend.

from fastapi import APIRouter, HTTPException

from app.modules.inventario.service import actualizar_inventario


# Router encargado de las operaciones relacionadas
# con la actualización del inventario.
router = APIRouter(
    prefix="/inventario",
    tags=["Inventario"]
)


@router.put("/actualizar")
def actualizar(
    id_bodega: int,
    id_material: int,
    cantidad: int,
    tipo_movimiento: str
):
    
   # Actualiza la cantidad de inventario.

   # Este endpoint recibe:
   # - La bodega.
   # - El material.
   # - La cantidad del movimiento.
   # - El tipo: ENTRADA o SALIDA.
    

    try:

        # El router recibe la petición y delega la lógica
        # al service.
        return actualizar_inventario(
            id_bodega=id_bodega,
            id_material=id_material,
            cantidad=cantidad,
            tipo_movimiento=tipo_movimiento
        )

    except ValueError as error:

        # Si alguna regla de negocio falla,
        # devolvemos un error HTTP 400.
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )