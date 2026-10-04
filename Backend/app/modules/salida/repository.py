# Funciones principales:
#   Validar existencia de material, proyecto y usuario.
#   Registrar el movimiento de tipo SALIDA en la tabla movimiento.

from sqlalchemy import text
from app.core.database import engine


def obtener_material(id_material):
    """Obtiene la información de un material por su ID."""
    with engine.connect() as connection:
        resultado = connection.execute(
            text("""
                SELECT
                    id_material,
                    codigo,
                    nombre,
                    tipo,
                    unidad_medida
                FROM material
                WHERE id_material = :id_material
            """),
            {"id_material": id_material}
        )
        fila = resultado.fetchone()

        if fila is None:
            return None

        return {
            "id_material": fila.id_material,
            "codigo": fila.codigo,
            "nombre": fila.nombre,
            "tipo": fila.tipo,
            "unidad_medida": fila.unidad_medida
        }


def obtener_proyecto(id_proyecto):
    """Obtiene la información de un proyecto por su ID."""
    with engine.connect() as connection:
        resultado = connection.execute(
            text("""
                SELECT
                    id_proyecto,
                    nombre,
                    ubicacion,
                    estado
                FROM proyecto
                WHERE id_proyecto = :id_proyecto
            """),
            {"id_proyecto": id_proyecto}
        )
        fila = resultado.fetchone()

        if fila is None:
            return None

        return {
            "id_proyecto": fila.id_proyecto,
            "nombre": fila.nombre,
            "ubicacion": fila.ubicacion,
            "estado": fila.estado
        }


def obtener_usuario(id_usuario):
    """Obtiene el nombre del usuario responsable."""
    with engine.connect() as connection:
        resultado = connection.execute(
            text("""
                SELECT
                    id_usuario,
                    nombre,
                    correo
                FROM usuario
                WHERE id_usuario = :id_usuario
            """),
            {"id_usuario": id_usuario}
        )
        fila = resultado.fetchone()

        if fila is None:
            return None

        return {
            "id_usuario": fila.id_usuario,
            "nombre": fila.nombre,
            "correo": fila.correo
        }


def registrar_movimiento_salida(
    id_material,
    cantidad,
    id_usuario,
    id_bodega_origen,
    id_proyecto,
    observacion=None
):
    
    """Registra un movimiento de tipo SALIDA en la tabla movimiento y
    devuelve el id_movimiento generado y la fecha del movimiento."""
    with engine.begin() as connection:
        resultado = connection.execute(
            text("""
                INSERT INTO movimiento (
                    tipo,
                    cantidad,
                    id_material,
                    id_usuario,
                    id_bodega_origen,
                    id_proyecto,
                    observacion
                )
                VALUES (
                    'SALIDA',
                    :cantidad,
                    :id_material,
                    :id_usuario,
                    :id_bodega_origen,
                    :id_proyecto,
                    :observacion
                )
                RETURNING id_movimiento, fecha_movimiento
            """),
            {
                "cantidad": cantidad,
                "id_material": id_material,
                "id_usuario": id_usuario,
                "id_bodega_origen": id_bodega_origen,
                "id_proyecto": id_proyecto,
                "observacion": observacion
            }
        )
        fila = resultado.fetchone()

        return {
            "id_movimiento": fila.id_movimiento,
            "fecha_movimiento": fila.fecha_movimiento
        }