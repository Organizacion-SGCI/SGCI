from sqlalchemy import create_engine

from app.core.config import (
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD
)

DATABASE_URL = (
    f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Zona horaria de las conexiones (Costa Rica)
engine = create_engine(
    DATABASE_URL,
    connect_args={"options": "-c timezone=America/Costa_Rica"}
)