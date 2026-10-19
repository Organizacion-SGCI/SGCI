# Capa de acceso a datos - notificaciones.

from sqlalchemy import text
from app.core.database import engine

def crear_notificacion(titulo, mensaje, tipo, id_usuario):
    with engine.begin() as connection:
        resultado = connection.execute(
            text("""
                INSERT INTO notificacion (titulo, mensaje, tipo, id_usuario)
                VALUES (:titulo, :mensaje, :tipo, :id_usuario)
                RETURNING id_notificacion, fecha_creacion
            """),
            {
                "titulo": titulo,
                "mensaje": mensaje,
                "tipo": tipo,
                "id_usuario": id_usuario
            }
        )
        fila = resultado.fetchone()
        return {
            "id_notificacion": fila.id_notificacion,
            "fecha_creacion": fila.fecha_creacion
        }

def obtener_notificaciones_usuario(id_usuario):
    with engine.connect() as connection:
        resultado = connection.execute(
            text("""
                SELECT id_notificacion, titulo, mensaje, tipo, fecha_creacion, leida
                FROM notificacion
                WHERE id_usuario = :id_usuario
                ORDER BY fecha_creacion DESC
            """),
            {"id_usuario": id_usuario}
        )
        return [dict(fila._mapping) for fila in resultado]