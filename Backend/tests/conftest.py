# Configuración compartida de pytest.
#
# Se ejecuta ANTES de importar la aplicación. Primero carga el .env del
# Backend (si existe) y después rellena con valores por defecto solo las
# variables que falten. Así:
#   - Las pruebas de integración (tests/test_permisos.py) siguen usando la
#     base de datos real configurada en el .env o en el CI.
#   - Las pruebas unitarias (tests/unit/) se pueden correr en cualquier
#     máquina, aunque no exista .env ni PostgreSQL.

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

VALORES_POR_DEFECTO = {
    "DB_HOST": "localhost",
    "DB_PORT": "5432",
    "DB_NAME": "sgci",
    "DB_USER": "postgres",
    "DB_PASSWORD": "postgres",
    "SECRET_KEY": "clave-solo-para-pruebas",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "480",
}

for variable, valor in VALORES_POR_DEFECTO.items():
    if not os.getenv(variable):
        os.environ[variable] = valor
