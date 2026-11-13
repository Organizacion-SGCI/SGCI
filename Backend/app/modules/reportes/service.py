# Capa de logica de negocio - reportes
# H-15.1: reporte de inventario actual
#
# El reporte trabaja solo con cantidades e inventario (sin precios ni costos), segun el alcance del proyecto

from datetime import datetime

from app.modules.reportes.repository import (
    obtener_bodega_con_acceso,
    obtener_proyecto_con_acceso,
    obtener_ids_bodegas_de_proyecto,
    consultar_inventario_actual
)

ESTADOS_REPORTE = ["OK", "STOCK_BAJO"]


class SinAccesoContexto(Exception):
    # El usuario no tiene acceso a la bodega o proyecto indicado
    pass


def generar_reporte_inventario(
    id_usuario,
    id_bodega=None,
    id_proyecto=None,
    material=None,
    estado=None
):
    """
    Genera el reporte del inventario actual (RF-14).

    - Con id_bodega: inventario de esa bodega.
    - Con id_proyecto: inventario de todas las bodegas asociadas al proyecto.
    Solo se permite UNO de los dos, y el usuario debe tener acceso a el.

    Filtros opcionales:
    - material: texto para buscar por nombre o codigo del material.
    - estado: OK o STOCK_BAJO.
    """

    # Debe venir exactamente uno de los dos contextos
    if (id_bodega is None) == (id_proyecto is None):
        raise ValueError("Indique id_bodega o id_proyecto (solo uno de los dos).")

    # Validar el estado (si viene)
    if estado:
        estado = estado.upper()
        if estado not in ESTADOS_REPORTE:
            raise ValueError("El estado indicado no es válido (use OK o STOCK_BAJO).")

    # Verificar que el usuario tenga acceso al contexto pedido
    # Recibir un id no basta: tiene que estar asignado a la bodega o proyecto
    if id_bodega is not None:
        encontrado = obtener_bodega_con_acceso(id_usuario, id_bodega)
        tipo_contexto = "BODEGA"
        id_contexto = id_bodega
        ids_bodega = [id_bodega]
    else:
        encontrado = obtener_proyecto_con_acceso(id_usuario, id_proyecto)
        tipo_contexto = "PROYECTO"
        id_contexto = id_proyecto
        ids_bodega = obtener_ids_bodegas_de_proyecto(id_proyecto) if encontrado else []

    if encontrado is None:
        raise SinAccesoContexto("No tiene acceso a la bodega o proyecto indicado.")

    # Texto de busqueda para el filtro por material
    buscar = None
    if material and material.strip():
        buscar = f"%{material.strip()}%"

    filas = consultar_inventario_actual(ids_bodega, buscar) if ids_bodega else []

    # Armar las filas del reporte (el estado usa la misma regla que H-06:
    # stock bajo cuando la cantidad es menor o igual al stock minimo)
    materiales = []

    for fila in filas:
        estado_fila = "STOCK_BAJO" if fila["cantidad"] <= fila["stock_minimo"] else "OK"

        if estado and estado != estado_fila:
            continue

        materiales.append({
            "codigo": fila["codigo"],
            "material": fila["material"],
            "categoria": fila["categoria"],
            "bodega": fila["bodega"],
            "unidad_medida": fila["unidad_medida"],
            "total_entradas": fila["total_entradas"],
            "total_salidas": fila["total_salidas"],
            "stock_actual": fila["cantidad"],
            "stock_minimo": fila["stock_minimo"],
            "estado": estado_fila,
            "fecha_ultima_actualizacion": fila["fecha_ultima_actualizacion"].isoformat()
        })

    return {
        "contexto": {
            "tipo": tipo_contexto,
            "id": id_contexto,
            "nombre": encontrado["nombre"]
        },
        "generado_en": datetime.now().isoformat(timespec="seconds"),
        "filtros": {
            "material": material.strip() if material and material.strip() else None,
            "estado": estado
        },
        "resumen": {
            "total_materiales": len(materiales),
            "con_stock_bajo": sum(1 for m in materiales if m["estado"] == "STOCK_BAJO")
        },
        "materiales": materiales
    }