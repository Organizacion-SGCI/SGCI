from fastapi import APIRouter

from app.modules.ingreso.service import obtener_comprobante_ingreso

from app.modules.ingreso.schemas import ComprobanteIngreso


router = APIRouter(
    prefix="/ingresos",
    tags=["Ingresos"]
)


@router.get(
    "/{id_movimiento}",
    response_model=ComprobanteIngreso,
    responses={
        404: {"description": "Registro de ingreso no encontrado"}
    }
)
def consultar_ingreso(id_movimiento: int):
    return obtener_comprobante_ingreso(id_movimiento)