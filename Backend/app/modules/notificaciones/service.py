# Capa de lógica - notificaciones.

from app.modules.notificaciones.repository import (
    crear_notificacion,
    obtener_notificaciones_usuario
)

def registrar_notificacion(titulo, mensaje, tipo, id_usuario):
    # Valida el tipo según la BD
    if tipo not in ["SOLICITUD", "CAMBIO_ESTADO", "STOCK_BAJO"]:
        raise ValueError("Tipo de notificación inválido.")
    
    return crear_notificacion(titulo, mensaje, tipo, id_usuario)

def listar_notificaciones(id_usuario):
    return obtener_notificaciones_usuario(id_usuario)