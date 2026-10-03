# seguridad y generacion de los token

from datetime import datetime, timedelta
from fastapi import Header, HTTPException
from jose import JWTError, jwt

from app.core.config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES

ALGORITHM = "HS256"

def crearToken(id_usuario: int, id_rol: int) -> str:
    """Genera un jwt con el id y el rol, y se expira con access token"""
    expira = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(id_usuario),
        "id_rol": id_rol,
        "exp": expira
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verificarToken(token: str):
    """Verifica y decodifica el token y devuelve el payload si es valido o si se expiro"""
    try: 
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def getCurrentUser(authorization: str =  Header(...)):
    """Dependencia para proteger endpoints, extrae el token del header"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Formato de token invalido")

    token = authorization.replace("Bearer ", "")
    payload = verificarToken(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")

    return payload

