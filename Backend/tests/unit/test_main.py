# Pruebas unitarias de app/main.py: endpoint raíz, rutas registradas y CORS.

from app.main import app


def test_endpoint_raiz_indica_que_la_api_funciona(client):
    respuesta = client.get("/")

    assert respuesta.status_code == 200
    assert respuesta.json() == {"mensaje": "API del SGCI funcionando"}


def test_todos_los_modulos_estan_registrados():
    # Se usa el esquema OpenAPI porque no depende de detalles internos de FastAPI
    rutas = set(app.openapi()["paths"])

    for esperada in [
        "/bodegas/",
        "/login/",
        "/contextos/{id_usuario}",
        "/permisos/{id_usuario}",
        "/inventario/{id_bodega}",
        "/inventario/actualizar",
        "/salidas/",
        "/movimientos/entrada",
        "/ingresos/{id_movimiento}",
        "/proyectos/activos",
        "/solicitudes/",
        "/solicitudes/aprobadas",
        "/notificaciones/",
        "/transferencias/",
        "/reportes/inventario",
        "/reportes/movimientos",
    ]:
        assert esperada in rutas, f"Falta la ruta {esperada}"


def test_cors_permite_el_frontend_local(client):
    respuesta = client.options(
        "/",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert respuesta.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_no_permite_origenes_desconocidos(client):
    respuesta = client.options(
        "/",
        headers={
            "Origin": "http://sitio-malicioso.com",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert "access-control-allow-origin" not in respuesta.headers
