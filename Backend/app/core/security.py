# Seguridad y generación de tokens JWT.
# Provee funciones para crear y verificar tokens, además de la
# dependency getCurrentUser para proteger endpoints.

# Usa HTTPBearer en lugar de Header(...) para que Swagger UI
# muestre el botón "Authorize" y funcione correctamente con cualquier cliente HTTP.

from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.core.config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES

ALGORITHM = "HS256"

# Esquema de seguridad HTTP Bearer.
# Swagger UI lo detecta automáticamente y muestra el botón "Authorize".
security = HTTPBearer()


def crearToken(id_usuario: int, id_rol: int) -> str:
    """Genera un JWT con el id de usuario y el rol, con expiración."""
    expira = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(id_usuario),
        "id_rol": id_rol,
        "exp": expira
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verificarToken(token: str):
    """Verifica y decodifica el token. Devuelve el payload o None si es inválido."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwtError:
        return None


def getCurrentUser(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Dependency para proteger endpoints.
    Extrae y verifica el token del header Authorization (Bearer).
    Devuelve el payload del JWT si es válido, o lanza 401 si no.
    """
    token = credentials.credentials
    payload = verificarToken(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    return payload