from sqlalchemy import text

from app.core.database import engine


def obtener_ingreso(id_movimiento):
    """Obtiene la información de un movimiento de tipo ENTRADA."""

    with engine.connect() as connection:
        resultado = connection.execute(
            text("""
                SELECT
                    mov.id_movimiento,
                    mov.fecha_movimiento,
                    mov.cantidad,

                    mat.id_material,
                    mat.codigo AS codigo_material,
                    mat.nombre AS material,
                    mat.unidad_medida,

                    prov.id_proveedor,
                    prov.nombre AS proveedor,

                    usu.id_usuario,
                    usu.nombre AS responsable

                FROM movimiento mov

                JOIN material mat
                    ON mat.id_material = mov.id_material

                JOIN proveedor prov
                    ON prov.id_proveedor = mov.id_proveedor

                JOIN usuario usu
                    ON usu.id_usuario = mov.id_usuario

                WHERE mov.id_movimiento = :id_movimiento
                  AND mov.tipo = 'ENTRADA'
            """),
            {
                "id_movimiento": id_movimiento
            }
        )

        fila = resultado.fetchone()

        if fila is None:
            return None

        return {
            "id_movimiento": fila.id_movimiento,
            "fecha_movimiento": fila.fecha_movimiento,

            "proveedor": {
                "id_proveedor": fila.id_proveedor,
                "nombre": fila.proveedor
            },

            "responsable": {
                "id_usuario": fila.id_usuario,
                "nombre": fila.responsable
            },

            "materiales": [
                {
                    "id_material": fila.id_material,
                    "codigo": fila.codigo_material,
                    "nombre": fila.material,
                    "unidad_medida": fila.unidad_medida,
                    "cantidad": fila.cantidad
                }
            ]
        }