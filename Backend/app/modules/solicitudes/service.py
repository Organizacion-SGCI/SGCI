# Capa de lógica de negocio - solicitudes.
# Aplica las reglas: RN-07, RN-08, RN-11.

from app.modules.solicitudes.repository import (
    crear_solicitud,
    crear_detalle_solicitud,
    existe_material,
    existe_bodega,
    listar_solicitudes_del_solicitante,
    listar_solicitudes_de_mis_bodegas,
    listar_materiales_de_solicitudes
)
from app.modules.notificaciones.service import registrar_notificacion
from app.modules.solicitudes.repository import (
    obtener_solicitud_por_id, 
    actualizar_estado_solicitud
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

    #Al menos un material
    if not materiales or len(materiales) == 0:
        raise ValueError("La solicitud debe incluir al menos un material.")

    #Cantidades válidas y materiales existentes
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


# H-05.1 - Consulta de solicitudes

ESTADOS_VALIDOS = [
    "PENDIENTE",
    "APROBADA",
    "RECHAZADA",
    "EN_TRANSITO",
    "COMPLETADA",
    "CANCELADA"
]


def obtener_solicitudes(id_usuario, rol, estado=None):
    """
    Devuelve las solicitudes que el usuario puede ver segun su rol
    - Encargado: solo las solicitudes que el creo
    - Jefe de Bodega: las solicitudes dirigidas a sus bodegas
    """
    # Valida el estado 
    if estado:
        estado = estado.upper()
        if estado not in ESTADOS_VALIDOS:
            raise ValueError("El estado indicado no es válido.")

    # Filtra segun el rol
    if rol == "Encargado":
        solicitudes = listar_solicitudes_del_solicitante(id_usuario, estado)
    elif rol == "Jefe de Bodega":
        solicitudes = listar_solicitudes_de_mis_bodegas(id_usuario, estado)
    else:
        raise ValueError("El rol del usuario no puede consultar solicitudes.")

    # Trae los materiales de todas las solicitudes encontradas
    materiales = listar_materiales_de_solicitudes(
        [s["id_solicitud"] for s in solicitudes]
    )

    # Arma la respuesta con el formato acordado en el contrato JSON
    resultado = []

    for s in solicitudes:
        resultado.append({
            "id_solicitud": s["id_solicitud"],
            "fecha_solicitud": s["fecha_solicitud"].isoformat(),
            "estado": s["estado"],
            "prioridad": s["prioridad"],
            "bodega_origen": s["bodega_origen"],
            "bodega_destino": s["bodega_destino"],
            "solicitante": s["solicitante"],
            "materiales": [
                {
                    "id_material": m["id_material"],
                    "nombre": m["nombre"],
                    "tipo": m["tipo"],
                    "cantidad": m["cantidad"]
                }
                for m in materiales
                if m["id_solicitud"] == s["id_solicitud"]
            ]
        })

    return resultado

def cambiar_estado_solicitud(id_solicitud, nuevo_estado, motivo=None):
    # Validar que exista
    solicitud = obtener_solicitud_por_id(id_solicitud)
    if not solicitud:
        raise ValueError("La solicitud no existe.")

    #Decisión única (solo si está PENDIENTE)
    if solicitud["estado"] != "PENDIENTE":
        raise ValueError(f"La solicitud ya fue procesada (Estado actual: {solicitud['estado']}).")

    #Actualizar estado
    actualizar_estado_solicitud(id_solicitud, nuevo_estado)

    # 4. RN-25: Notificar al solicitante
    id_solicitante = solicitud["id_usuario"]
    if nuevo_estado == "APROBADA":
        registrar_notificacion(
            titulo="Solicitud Aprobada",
            mensaje=f"Tu solicitud #{id_solicitud} ha sido aprobada.",
            tipo="CAMBIO_ESTADO",
            id_usuario=id_solicitante
        )
    elif nuevo_estado == "RECHAZADA":
        msj = f"Tu solicitud #{id_solicitud} ha sido rechazada."
        if motivo:
            msj += f" Motivo: {motivo}"
        
        registrar_notificacion(
            titulo="Solicitud Rechazada",
            mensaje=msj,
            tipo="CAMBIO_ESTADO",
            id_usuario=id_solicitante
        )

    return {
        "id_solicitud": id_solicitud, 
        "estado": nuevo_estado, 
        "mensaje": "Estado actualizado correctamente"
    }