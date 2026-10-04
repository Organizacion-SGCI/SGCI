# Aquí están las reglas de negocio.
# Capa de lógica de negocio.
# Aquí se aplican las reglas que debe cumplir una operación
# antes de modificar el inventario.

from app.modules.inventario.repository import (
    actualizar_cantidad_inventario
)


def actualizar_inventario(
    id_bodega,
    id_material,
    cantidad,
    tipo_movimiento
):
    
   # Actualiza el inventario según el tipo de movimiento.

    #Reglas principales:
   # - La cantidad debe ser mayor que cero.
   # - Solo se permiten ENTRADA y SALIDA.
   # - Una SALIDA no puede superar la cantidad disponible.


    # Validamos que la cantidad sea positiva.
    if cantidad <= 0:
        raise ValueError(
            "La cantidad del movimiento debe ser mayor que cero."
        )

    # Validamos que el tipo de movimiento sea válido.
    if tipo_movimiento not in ["ENTRADA", "SALIDA"]:
        raise ValueError(
            "El tipo de movimiento debe ser ENTRADA o SALIDA."
        )

    # Para las salidas necesitamos conocer primero
    # cuánto material existe actualmente.
    if tipo_movimiento == "SALIDA":

        from sqlalchemy import text
        from app.core.database import engine

        with engine.connect() as connection:

            resultado = connection.execute(
                text("""
                    SELECT cantidad
                    FROM inventario
                    WHERE id_bodega = :id_bodega
                      AND id_material = :id_material
                """),
                {
                    "id_bodega": id_bodega,
                    "id_material": id_material
                }
            )

            inventario = resultado.fetchone()

        # Si no existe inventario para ese material y bodega,
        # no se puede realizar la salida.
        if inventario is None:
            raise ValueError(
                "No existe inventario para el material "
                "en la bodega seleccionada."
            )

        # No permitimos retirar más material del disponible.
        if cantidad > inventario.cantidad:
            raise ValueError(
                "La cantidad de salida supera el inventario disponible."
            )

    # Una vez que las validaciones fueron superadas,
    # llamamos al repository para modificar la base de datos.
    nueva_cantidad = actualizar_cantidad_inventario(
        id_bodega,
        id_material,
        cantidad,
        tipo_movimiento
    )

    # Si el repository no encontró el inventario,
    # informamos el problema.
    if nueva_cantidad is None:
        raise ValueError(
            "No existe inventario para el material "
            "en la bodega seleccionada."
        )

    return {
        "id_bodega": id_bodega,
        "id_material": id_material,
        "tipo_movimiento": tipo_movimiento,
        "cantidad_movimiento": cantidad,
        "cantidad_actual": nueva_cantidad
    }

def listarInventario(id_bodega: int):
    #devuelve el inventario completo de la bodega
    from app.modules.inventario.repository import(
        obtenerInventarioBodega,
        obtenerBodega
    )

    bodega = obtenerBodega(id_bodega)
    if bodega is None:
        raise ValueError("Bodega no encontrada")

    materiales = obtenerInventarioBodega(id_bodega)
        #aca se calcula el stock bajo de cada material
    for m in materiales:
        m["stock_bajo"] = m["cantidad"] <= m["stock_minimo"]

    return{
        "id_bodega": bodega["id_bodega"],
        "bodega": bodega["nombre"],
        "materiales": materiales
    }
            
