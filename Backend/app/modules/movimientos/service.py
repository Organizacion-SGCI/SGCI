# Capa de lógica de negocio.
# Valida las reglas antes de registrar un movimiento.

from app.modules.movimientos.repository import (
    insertarMovimiento,
    existeMaterial,
    existeProveedor
)
from app.modules.inventario.service import actualizar_inventario


def registrarEntrada(
    id_material,
    cantidad,
    id_bodega,
    id_proveedor,
    id_usuario,
    observacion=None
):
    """Registra una entrada de material al inventario."""

    # Validar cantidad
    if cantidad <= 0:
        raise ValueError("La cantidad debe ser mayor que cero.")

    # Validar que el material exista
    if not existeMaterial(id_material):
        raise ValueError("El material no existe.")

    # Validar que el proveedor exista
    if not existeProveedor(id_proveedor):
        raise ValueError("El proveedor no existe.")

    # 1. Insertar el movimiento (ENTRADA)
    movimiento = insertarMovimiento(
        tipo="ENTRADA",
        cantidad=cantidad,
        id_material=id_material,
        id_usuario=id_usuario,
        id_bodega_origen=None,          # no aplica al entrar
        id_bodega_destino=id_bodega,     # bodega que recibe
        id_proveedor=id_proveedor,
        observacion=observacion
    )

    #  Actualizar el inventario (T-04)
    resultado_inventario = actualizar_inventario(
        id_bodega=id_bodega,
        id_material=id_material,
        cantidad=cantidad,
        tipo_movimiento="ENTRADA"
    )

    #  Devolver el resultado
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
        "cantidad_actual": resultado_inventario["cantidad_actual"]
    }