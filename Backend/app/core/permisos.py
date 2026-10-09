# Diccionario de permisos por rol.

PERMISOS_POR_ROL = {
    "Administrador": {
        # TI (mantenimiento del sistema)
        "gestionar_usuario",
        "gestionar_rol",
        "gestionar_bodega",
        "gestionar_proyecto",
        "gestionar_material",
        # Solo lectura (para soporte y diagnóstico)
        "ver_inventario",
        "ver_trazabilidad",
        "generar_reporte",
    },
    "Jefe de Bodega": {
        "ver_inventario",
        "aprobar_solicitud",
        "rechazar_solicitud",
        "transferir_material",
        "repartir_material",
        "gestionar_material",
        "generar_reporte",
        "ver_trazabilidad",
        "emitir_vale",
    },
    "Encargado": {
        "ver_inventario",
        "solicitar_material",
        "confirmar_recepcion",
        "ver_trazabilidad",
    },
    "Jefa de Construcción": {
        "ver_inventario",
        "emitir_vale",
        "aprobar_lista",
        "gestionar_bodega",
        "gestionar_proyecto",
        "generar_reporte",
        "ver_trazabilidad",
    },
}