# Capa de acceso a datos - solicitudes.

from sqlalchemy import text
from app.core.database import engine


def crear_solicitud(id_bodega_origen, id_bodega_destino, prioridad, id_usuario):
    #Inserta la cabecera de la solicitud y devuelve su ID
    with engine.begin() as connection:
        resultado = connection.execute(
            text("""
                INSERT INTO solicitud (
                    estado, prioridad, id_usuario, id_bodega_origen, id_bodega_destino
                )
                VALUES (
                    'PENDIENTE', :prioridad, :id_usuario, :id_bodega_origen, :id_bodega_destino
                )
                RETURNING id_solicitud, fecha_solicitud
            """),
            {
                "prioridad": prioridad,
                "id_usuario": id_usuario,
                "id_bodega_origen": id_bodega_origen,
                "id_bodega_destino": id_bodega_destino
            }
        )
        fila = resultado.fetchone()
        return {
            "id_solicitud": fila.id_solicitud,
            "fecha_solicitud": fila.fecha_solicitud
        }


def crear_detalle_solicitud(id_solicitud, id_material, cantidad):
    #Inserta un detalle de material en la solicitud
    with engine.begin() as connection:
        connection.execute(
            text("""
                INSERT INTO detalle_solicitud (id_solicitud, id_material, cantidad_solicitada)
                VALUES (:id_solicitud, :id_material, :cantidad)
            """),
            {
                "id_solicitud": id_solicitud,
                "id_material": id_material,
                "cantidad": cantidad
            }
        )


def existe_material(id_material):
    #Verifica que el material exista
    with engine.connect() as connection:
        resultado = connection.execute(
            text("SELECT id_material FROM material WHERE id_material = :id_material"),
            {"id_material": id_material}
        )
        return resultado.fetchone() is not None


def existe_bodega(id_bodega):
    #Verifica que la bodega exista
    with engine.connect() as connection:
        resultado = connection.execute(
            text("SELECT id_bodega FROM bodega WHERE id_bodega = :id_bodega"),
            {"id_bodega": id_bodega}
        )
        return resultado.fetchone() is not None