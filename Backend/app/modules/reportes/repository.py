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