# Capa de lógica de negocio.
# Valida las reglas antes de registrar un movimiento.

from app.modules.movimientos.repository import (
    insertar_movimiento,
    existe_material,
    existe_proveedor
)
from app.modules.inventario.service import actualizar_inventario


def registrar_entrada(
    id_material,
    cantidad,
    id_bodega,
    id_proveedor,
    id_usuario,
    observacion=None,
    precio_unitario=None,
    num_factura=None,
    num_oc=None
):
    """Registra una entrada de material al inventario."""

    if cantidad <= 0:
        raise ValueError("La cantidad debe ser mayor que cero.")

    if not existe_material(id_material):
        raise ValueError("El material no existe.")

    if not existe_proveedor(id_proveedor):
        raise ValueError("El proveedor no existe.")

    #  Insertar el movimiento
    movimiento = insertar_movimiento(
        tipo="ENTRADA",
        cantidad=cantidad,
        id_material=id_material,
        id_usuario=id_usuario,
        id_bodega_origen=None,
        id_bodega_destino=id_bodega,
        id_proveedor=id_proveedor,
        observacion=observacion,
        precio_unitario=precio_unitario,
        num_factura=num_factura,
        num_oc=num_oc
    )

    #  Actualizar inventario
    resultado_inventario = actualizar_inventario(
        id_bodega=id_bodega,
        id_material=id_material,
        cantidad=cantidad,
        tipo_movimiento="ENTRADA"
    )

    # Devolver el resultado
    return {
        "id_movimiento": movimiento["id_movimiento"],
        "fecha_movimiento": str(movimiento["fecha_movimiento"]),
        "tipo": "ENTRADA",
        "id_material": id_material,
        "cantidad": cantidad,
        "id_bodega": id_bodega,
        "id_proveedor": id_proveedor,
        "id_usuario": id_usuario,
        "observacion": observacion,
        "precio_unitario": precio_unitario,
        "num_factura": num_factura,
        "num_oc": num_oc,
        "cantidad_actual": resultado_inventario["cantidad_actual"]
    }