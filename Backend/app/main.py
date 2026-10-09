from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI
from app.modules.contexto.router import router as contexto_router
from app.modules.bodega.router import router as bodega_router
from app.modules.login.router import router as login_router
from app.modules.permisos.router import router as permisos_router
from app.modules.inventario.router import router as inventario_router
<<<<<<< Updated upstream
=======
from app.modules.salida.router import router as salida_router
from app.modules.movimientos.router import router as movimientos_router
from app.modules.ingreso.router import router as ingreso_router
from app.modules.proyectos.router import router as proyectos_router

>>>>>>> Stashed changes
from app.modules.salida.router import router as salida_router
from app.modules.movimientos.router import router as movimientos_router
from app.modules.ingreso.router import router as ingreso_router


# Aplicación principal de FastAPI.
app = FastAPI(
    title="SGCI API",
    description="Sistema de Gestión y Control de Inventario",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def inicio():
    # Endpoint inicial para comprobar que la API está funcionando
    return {
        "mensaje": "API del SGCI funcionando"
    }


# Registramos las rutas del módulo de bodegas
app.include_router(bodega_router)
app.include_router(login_router)
app.include_router(contexto_router)
app.include_router(permisos_router)
<<<<<<< Updated upstream
app.include_router(inventario_router)
=======
app.include_router(inventario_router)