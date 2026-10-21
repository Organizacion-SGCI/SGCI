# Capa de acceso a datos - movimientos.

from sqlalchemy import text
from app.core.database import engine


def insertar_movimiento(
    tipo, cantidad, id_material, id_usuario,
    id_bodega_origen, id_bodega_destino, id_proveedor, observacion,
    precio_unitario=None, num_factura=None, num_oc=None
):
    """Inserta un movimiento en la BD y devuelve su id."""
    with engine.begin() as connection:
        resultado = connection.execute(
            text("""
                INSERT INTO movimiento (
                    tipo, cantidad, id_material, id_usuario,
                    id_bodega_origen, id_bodega_destino, id_proveedor,
                    precio_unitario, num_factura, num_oc, observacion
                )
                VALUES (
                    :tipo, :cantidad, :id_material, :id_usuario,
                    :id_bodega_origen, :id_bodega_destino, :id_proveedor,
                    :precio_unitario, :num_factura, :num_oc, :observacion
                )
                RETURNING id_movimiento, fecha_movimiento
            """),
            {
                "tipo": tipo, "cantidad": cantidad, "id_material": id_material,
                "id_usuario": id_usuario, "id_bodega_origen": id_bodega_origen,
                "id_bodega_destino": id_bodega_destino, "id_proveedor": id_proveedor,
                "precio_unitario": precio_unitario, "num_factura": num_factura,
                "num_oc": num_oc, "observacion": observacion
            }
        )
        fila = resultado.fetchone()
        return {
            "id_movimiento": fila.id_movimiento,
            "fecha_movimiento": fila.fecha_movimiento
        }


def existe_material(id_material):
    """Verifica que el material exista."""
    with engine.connect() as connection:
        resultado = connection.execute(
            text("SELECT id_material FROM material WHERE id_material = :id_material"),
            {"id_material": id_material}
        )
        return resultado.fetchone() is not None


def existe_proveedor(id_proveedor):
    """Verifica que el proveedor exista."""
    with engine.connect() as connection:
        resultado = connection.execute(
            text("SELECT id_proveedor FROM proveedor WHERE id_proveedor = :id_proveedor"),
            {"id_proveedor": id_proveedor}
        )
        return resultado.fetchone() is not None