# Capa de logica de negocio - transferencias.
# H-10.2: confirma la transferencia de una solicitud aprobada.

from app.modules.transferencias.repository import (
    ejecutar_transferencia,
    SolicitudNoEncontrada,
    SinPermisoTransferencia,
    TransferenciaInvalida
)


def confirmar_transferencia(id_usuario, id_solicitud):
    """
    Confirma la transferencia de una solicitud aprobada (RF-09).

    Las validaciones (estado, permiso y stock) y los cambios en la base
    de datos se hacen en una sola transaccion dentro del repository.
    Devuelve el pedido creado, en estado EN_TRANSITO.
    """

    resultado = ejecutar_transferencia(id_solicitud, id_usuario)

    return {
        "id_pedido": resultado["id_pedido"],
        "id_solicitud": resultado["id_solicitud"],
        "estado": "EN_TRANSITO",
        "fecha_pedido": resultado["fecha_pedido"].isoformat(),
        "bodega_salida": resultado["bodega_salida"],
        "bodega_recepcion": resultado["bodega_recepcion"],
        "materiales": resultado["materiales"]
    }