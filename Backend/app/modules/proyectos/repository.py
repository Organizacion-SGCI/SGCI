
# Consulta la tabla proyecto de PostgreSQL.

from sqlalchemy import text
from app.core.database import engine


def obtener_proyectos_activos():
    """Devuelve todos los proyectos con estado ACTIVO."""
    with engine.connect() as connection:
        resultado = connection.execute(
            text("""
                SELECT
                    id_proyecto,
                    nombre,
                    ubicacion,
                    estado
                FROM proyecto
                WHERE estado = 'ACTIVO'
                ORDER BY nombre
            """)
        )

        return [
            {
                "id_proyecto": fila.id_proyecto,
                "nombre": fila.nombre,
                "ubicacion": fila.ubicacion,
                "estado": fila.estado
            }
            for fila in resultado
        ]