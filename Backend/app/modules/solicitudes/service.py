# Capa de lógica de negocio - solicitudes.
# Aplica las reglas: RN-07, RN-08, RN-11.

from app.modules.solicitudes.repository import (
    crear_solicitud,
    crear_detalle_solicitud,
    existe_material,
    existe_bodega
)


def registrar_solicitud(
    id_usuario,
    id_bodega_origen,
    id_bodega_destino,
    prioridad,
    materiales
):
    """
    Registra una solicitud de materiales.
    
    RN-07: La bodega origen debe ser distinta a la destino.
    RN-08: Debe haber al menos un material.
    RN-11: Cada material debe tener cantidad > 0.
    """

    # validar las bodegas distintas
    if id_bodega_origen == id_bodega_destino:
        raise ValueError("La bodega de origen debe ser distinta a la de destino.")

    # Validar que las bodegas existan
    if not existe_bodega(id_bodega_origen):
        raise ValueError("La bodega de origen no existe.")
    if not existe_bodega(id_bodega_destino):
        raise ValueError("La bodega de destino no existe.")

    # RN-08: Al menos un material
    if not materiales or len(materiales) == 0:
        raise ValueError("La solicitud debe incluir al menos un material.")

    # RN-11: Cantidades válidas y materiales existentes
    for item in materiales:
        if item["cantidad"] <= 0:
            raise ValueError(
                f"La cantidad del material {item['id_material']} debe ser mayor que cero."
            )
        if not existe_material(item["id_material"]):
            raise ValueError(f"El material {item['id_material']} no existe.")

    # Crear solicitud
    solicitud = crear_solicitud(
        id_bodega_origen=id_bodega_origen,
        id_bodega_destino=id_bodega_destino,
        prioridad=prioridad,
        id_usuario=id_usuario
    )

    # Crear detalles
    for item in materiales:
        crear_detalle_solicitud(
            id_solicitud=solicitud["id_solicitud"],
            id_material=item["id_material"],
            cantidad=item["cantidad"]
        )

    # Devolver respuesta
    return {
        "id_solicitud": solicitud["id_solicitud"],
        "estado": "PENDIENTE",
        "fecha_solicitud": str(solicitud["fecha_solicitud"]),
        "id_bodega_origen": id_bodega_origen,
        "id_bodega_destino": id_bodega_destino,
        "prioridad": prioridad,
        "materiales": materiales
    }