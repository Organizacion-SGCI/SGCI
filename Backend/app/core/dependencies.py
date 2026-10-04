
# Dependencias reutilizables para proteger endpoints según el rol del usuario.
# Combina la verificación del JWT (getCurrentUser) con la validación
# del diccionario de permisos (PERMISOS_POR_ROL).

from fastapi import Depends, HTTPException

from app.core.security import getCurrentUser
from app.modules.permisos.service import obtener_permisos


def require_rol(roles_permitidos: list):
    """
    Dependency factory que protege un endpoint según los roles permitidos.

    Uso:
        @router.post("/salidas")
        def crear_salida(
            payload = Depends(require_rol(["Jefe de Bodega", "Jefa de Construcción"]))
        ):
            id_usuario = payload["id_usuario"]
            ...

    Retorna un dict enriquecido con:
        - sub: id_usuario (del JWT, como string)
        - id_rol: id del rol (del JWT)
        - id_usuario: id del usuario como int
        - rol: nombre del rol ("Jefe de Bodega", etc.)
        - permisos: lista de permisos del rol
    """
    def verificar(payload: dict = Depends(getCurrentUser)):
        id_usuario = int(payload["sub"])

        try:
            info = obtener_permisos(id_usuario)
        except ValueError:
            raise HTTPException(status_code=401, detail="Usuario no válido")

        if info["rol"] not in roles_permitidos:
            raise HTTPException(
                status_code=403,
                detail="No tiene permiso para realizar esta acción"
            )

        return {
            **payload,
            "id_usuario": id_usuario,
            "rol": info["rol"],
            "permisos": info["permisos"]
        }

    return verificar