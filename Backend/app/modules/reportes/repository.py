# Capa de acceso a datos - reportes
# H-15.1: consultas para el reporte de inventario actual

from sqlalchemy import text, bindparam

from app.core.database import engine


def obtener_bodega_con_acceso(id_usuario, id_bodega):
    # Devuelve la bodega solo si el usuario esta asignado a ella (usuario_bodega)
    # Si no existe o no tiene acceso, devuelve None
    with engine.connect() as connection:
        fila = connection.execute(
            text("""
                SELECT b.id_bodega, b.nombre
                FROM bodega b
                JOIN usuario_bodega ub ON ub.id_bodega = b.id_bodega
                WHERE ub.id_usuario = :id_usuario
                  AND b.id_bodega = :id_bodega
            """),
            {"id_usuario": id_usuario, "id_bodega": id_bodega}
        ).fetchone()

        return dict(fila._mapping) if fila else None


def obtener_proyecto_con_acceso(id_usuario, id_proyecto):
    # Devuelve el proyecto solo si el usuario esta asignado a el (usuario_proyecto)
    # Si no existe o no tiene acceso, devuelve None
    with engine.connect() as connection:
        fila = connection.execute(
            text("""
                SELECT p.id_proyecto, p.nombre
                FROM proyecto p
                JOIN usuario_proyecto up ON up.id_proyecto = p.id_proyecto
                WHERE up.id_usuario = :id_usuario
                  AND p.id_proyecto = :id_proyecto
            """),
            {"id_usuario": id_usuario, "id_proyecto": id_proyecto}
        ).fetchone()

        return dict(fila._mapping) if fila else None


def obtener_ids_bodegas_de_proyecto(id_proyecto):
    # Devuelve los ids de las bodegas asociadas a un proyecto
    with engine.connect() as connection:
        resultado = connection.execute(
            text("""
                SELECT id_bodega
                FROM proyecto_bodega
                WHERE id_proyecto = :id_proyecto
                ORDER BY id_bodega
            """),
            {"id_proyecto": id_proyecto}
        )
        return [fila.id_bodega for fila in resultado]


def consultar_inventario_actual(ids_bodega, buscar=None):
    # Devuelve el inventario de una o varias bodegas, con los totales de
    # entradas y salidas de cada material (mismo calculo que H-06)
    # "buscar" filtra por nombre o codigo del material (opcional)
    sql = """
        SELECT
            b.nombre AS bodega,
            m.codigo,
            m.nombre AS material,
            m.tipo AS categoria,
            m.unidad_medida,
            i.cantidad,
            i.stock_minimo,
            i.fecha_ultima_actualizacion,
            COALESCE((SELECT SUM(cantidad) FROM movimiento WHERE id_material = m.id_material AND id_bodega_destino = i.id_bodega AND tipo = 'ENTRADA'), 0) AS total_entradas,
            COALESCE((SELECT SUM(cantidad) FROM movimiento WHERE id_material = m.id_material AND id_bodega_origen = i.id_bodega AND tipo = 'SALIDA'), 0) AS total_salidas
        FROM inventario i
        JOIN material m ON m.id_material = i.id_material
        JOIN bodega b ON b.id_bodega = i.id_bodega
        WHERE i.id_bodega IN :ids_bodega
    """

    parametros = {"ids_bodega": list(ids_bodega)}

    if buscar:
        sql += " AND (m.nombre ILIKE :buscar OR m.codigo ILIKE :buscar)"
        parametros["buscar"] = buscar

    sql += " ORDER BY b.nombre, m.codigo"

    with engine.connect() as connection:
        resultado = connection.execute(
            text(sql).bindparams(bindparam("ids_bodega", expanding=True)),
            parametros
        )
        return [dict(fila._mapping) for fila in resultado]


def consultar_historial(
    id_bodega,
    id_proyecto,
    fecha_desde,
    fecha_hasta,
    tipo,
    material,
):
    sql = """
        SELECT
            mov.id_movimiento,
            mov.fecha_movimiento AT TIME ZONE 'America/Costa_Rica' AS fecha_movimiento,
            mov.tipo,
            mov.cantidad,
            mat.codigo AS codigo_material,
            mat.nombre AS material,
            mat.unidad_medida,
            COALESCE(origen.nombre, prov.nombre) AS origen,
            COALESCE(destino.nombre, proy.nombre) AS destino,
            u.nombre AS responsable,
            mov.observacion
        FROM movimiento mov
        JOIN material mat ON mat.id_material = mov.id_material
        JOIN usuario u ON u.id_usuario = mov.id_usuario
        LEFT JOIN bodega origen ON origen.id_bodega = mov.id_bodega_origen
        LEFT JOIN bodega destino ON destino.id_bodega = mov.id_bodega_destino
        LEFT JOIN proveedor prov ON prov.id_proveedor = mov.id_proveedor
        LEFT JOIN proyecto proy ON proy.id_proyecto = mov.id_proyecto
    """

    if id_bodega is not None:
        sql += " WHERE :id_bodega IN (mov.id_bodega_origen, mov.id_bodega_destino)"
        parametros = {"id_bodega": id_bodega}
    else:
        sql += " WHERE mov.id_proyecto = :id_proyecto"
        parametros = {"id_proyecto": id_proyecto}

    if fecha_desde:
        sql += " AND mov.fecha_movimiento >= :fecha_desde"
        parametros["fecha_desde"] = fecha_desde

    if fecha_hasta:
        # Incluye todos los movimientos del último día seleccionado.
        sql += " AND mov.fecha_movimiento < CAST(:fecha_hasta AS date) + INTERVAL '1 day'"
        parametros["fecha_hasta"] = fecha_hasta

    if tipo:
        sql += " AND mov.tipo = :tipo"
        parametros["tipo"] = tipo

    if material:
        sql += " AND (mat.nombre ILIKE :material OR mat.codigo ILIKE :material)"
        parametros["material"] = f"%{material}%"

    sql += " ORDER BY mov.fecha_movimiento DESC, mov.id_movimiento DESC"

    with engine.connect() as connection:
        resultado = connection.execute(text(sql), parametros)
        return [dict(fila) for fila in resultado.mappings()]