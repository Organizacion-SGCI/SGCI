#service.py
#capa de logica
#valida las credencialees del usuario
from passlib.context import CryptContext

from app.modules.login.repository import obtenerUserCorreo
from app.core.security import crearToken


pwdContext = CryptContext(schemes=["bcrypt"], deprecated="auto")

#se validan las credenciales 
def autenticar(correo: str, password: str):

    usuario = obtenerUserCorreo(correo)

    if usuario is None:
        raise ValueError("Las credenciales son incorrectas")

    if usuario["estado"] != "ACTIVO":
        raise ValueError("El usuario esta inactivo")

    if not pwdContext.verify(password, usuario["password"]):
        raise ValueError("Credenciales incorrectas")

    #Generar token
    token = crearToken(
        id_usuario=usuario["id_usuario"],
        id_rol=usuario["id_rol"]
    )

    return {
        "token": token,
        "expira_en": 480,
        "usuario": {
            "id_usuario": usuario["id_usuario"],
            "nombre": usuario["nombre"],
            "correo": usuario["correo"],
            "id_rol": usuario["id_rol"],
            "rol": usuario["rol"]
        }
    }

