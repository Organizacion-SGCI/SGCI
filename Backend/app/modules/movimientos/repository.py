# Capa de acceso a datos.
# Aquí se realizan las consultas y modificaciones directamente
# sobre las tablas de PostgreSQL relacionadas con movimientos.

from sqlalchemy import text

from app.core.database import engine


def insertarMovimiento(
    tipo,
    cantidad,
    id_material,
    id_usuario,
    id_bodega_origen,
    id_bodega_destino,
    id_proveedor,
    observacion
):
    """Inserta un movimiento en la BD y devuelve su id."""
    with engine.begin() as connection:
        resultado = connection.execute(
            text("""
                INSERT INTO movimiento (
                    tipo,
                    cantidad,
                    id_material,
                    id_usuario,
                    id_bodega_origen,
                    id_bodega_destino,
                    id_proveedor,
                    observacion
                )
                VALUES (
                    :tipo,
                    :cantidad,
                    :id_material,
                    :id_usuario,
                    :id_bodega_origen,
                    :id_bodega_destino,
                    :id_proveedor,
                    :observacion
                )
                RETURNING id_movimiento, fecha_movimiento
            """),
            {
                "tipo": tipo,
                "cantidad": cantidad,
                "id_material": id_material,
                "id_usuario": id_usuario,
                "id_bodega_origen": id_bodega_origen,
                "id_bodega_destino": id_bodega_destino,
                "id_proveedor": id_proveedor,
                "observacion": observacion
            }
        )
        fila = resultado.fetchone()
        return {
            "id_movimiento": fila.id_movimiento,
            "fecha_movimiento": fila.fecha_movimiento
        }


def existeMaterial(id_material):
    """Verifica que el material exista."""
    with engine.connect() as connection:
        resultado = connection.execute(
            text("SELECT id_material FROM material WHERE id_material = :id_material"),
            {"id_material": id_material}
        )
        return resultado.fetchone() is not None


def existeProveedor(id_proveedor):
    """Verifica que el proveedor exista."""
    with engine.connect() as connection:
        resultado = connection.execute(
            text("SELECT id_proveedor FROM proveedor WHERE id_proveedor = :id_proveedor"),
            {"id_proveedor": id_proveedor}
        )
        return resultado.fetchone() is not None