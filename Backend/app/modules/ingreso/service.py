from fastapi import HTTPException

from app.modules.ingreso.repository import obtener_ingreso


def obtener_comprobante_ingreso(id_movimiento):
    ingreso = obtener_ingreso(id_movimiento)

    if ingreso is None:
        raise HTTPException(
            status_code=404,
            detail="Registro de ingreso no encontrado"
        )

    return ingreso