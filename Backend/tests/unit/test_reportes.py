# Pruebas unitarias del módulo reportes.
# H-15.1: reporte de inventario actual. H-15.2: historial de movimientos.

from datetime import date, datetime

import pytest

from app.modules.reportes import repository as reportes_repository
from app.modules.reportes import router as reportes_router
from app.modules.reportes import service as reportes_service
from app.modules.reportes.service import SinAccesoContexto

from tests.unit.bd_falsa import Fila


FECHA = datetime(2026, 11, 4, 9, 30)


def _fila_inventario(codigo, cantidad, stock_minimo, bodega="Central"):
    return {
        "codigo": codigo, "material": f"Material {codigo}", "categoria": "General",
        "bodega": bodega, "unidad_medida": "Unidad", "total_entradas": 20,
        "total_salidas": 5, "cantidad": cantidad, "stock_minimo": stock_minimo,
        "fecha_ultima_actualizacion": FECHA,
    }


@pytest.fixture
def inventario(monkeypatch):
    estado = {
        "bodega": {"id_bodega": 1, "nombre": "Central"},
        "proyecto": {"id_proyecto": 7, "nombre": "Hotel"},
        "bodegas_proyecto": [1, 2],
        "filas": [
            _fila_inventario("M1", 3, 5),    # bajo
            _fila_inventario("M2", 5, 5),    # igual al mínimo -> bajo
            _fila_inventario("M3", 50, 10),  # ok
        ],
        "consultas": [],
    }

    monkeypatch.setattr(reportes_service, "obtener_bodega_con_acceso", lambda u, b: estado["bodega"])
    monkeypatch.setattr(reportes_service, "obtener_proyecto_con_acceso", lambda u, p: estado["proyecto"])
    monkeypatch.setattr(reportes_service, "obtener_ids_bodegas_de_proyecto", lambda p: estado["bodegas_proyecto"])

    def consultar(ids, buscar):
        estado["consultas"].append((ids, buscar))
        return estado["filas"]

    monkeypatch.setattr(reportes_service, "consultar_inventario_actual", consultar)
    return estado


# ============================================================
# Service: generar_reporte_inventario
# ============================================================

def test_reporte_por_bodega(inventario):
    reporte = reportes_service.generar_reporte_inventario(1, id_bodega=1)

    assert reporte["contexto"] == {"tipo": "BODEGA", "id": 1, "nombre": "Central"}
    assert reporte["resumen"] == {"total_materiales": 3, "con_stock_bajo": 2}
    assert [m["estado"] for m in reporte["materiales"]] == ["STOCK_BAJO", "STOCK_BAJO", "OK"]
    assert inventario["consultas"] == [([1], None)]

    fila = reporte["materiales"][2]
    assert fila["stock_actual"] == 50
    assert fila["fecha_ultima_actualizacion"] == FECHA.isoformat()
    # El reporte no maneja precios ni costos
    assert not any("precio" in clave or "costo" in clave for clave in fila)


def test_reporte_por_proyecto_usa_todas_sus_bodegas(inventario):
    reporte = reportes_service.generar_reporte_inventario(1, id_proyecto=7)

    assert reporte["contexto"] == {"tipo": "PROYECTO", "id": 7, "nombre": "Hotel"}
    assert inventario["consultas"] == [([1, 2], None)]


def test_proyecto_sin_bodegas_devuelve_reporte_vacio(inventario):
    inventario["bodegas_proyecto"] = []

    reporte = reportes_service.generar_reporte_inventario(1, id_proyecto=7)

    assert reporte["materiales"] == []
    assert inventario["consultas"] == []


@pytest.mark.parametrize("kwargs", [{}, {"id_bodega": 1, "id_proyecto": 7}])
def test_debe_venir_exactamente_un_contexto(inventario, kwargs):
    with pytest.raises(ValueError, match="solo uno de los dos"):
        reportes_service.generar_reporte_inventario(1, **kwargs)


def test_sin_acceso_a_la_bodega(inventario):
    inventario["bodega"] = None

    with pytest.raises(SinAccesoContexto):
        reportes_service.generar_reporte_inventario(1, id_bodega=1)


def test_sin_acceso_al_proyecto(inventario):
    inventario["proyecto"] = None

    with pytest.raises(SinAccesoContexto):
        reportes_service.generar_reporte_inventario(1, id_proyecto=7)


@pytest.mark.parametrize("estado, codigos", [
    ("STOCK_BAJO", ["M1", "M2"]),
    ("stock_bajo", ["M1", "M2"]),
    ("OK", ["M3"]),
])
def test_filtro_por_estado(inventario, estado, codigos):
    reporte = reportes_service.generar_reporte_inventario(1, id_bodega=1, estado=estado)

    assert [m["codigo"] for m in reporte["materiales"]] == codigos
    assert reporte["filtros"]["estado"] == estado.upper()
    # El resumen se calcula sobre lo filtrado
    assert reporte["resumen"]["total_materiales"] == len(codigos)


def test_estado_invalido(inventario):
    with pytest.raises(ValueError, match="OK o STOCK_BAJO"):
        reportes_service.generar_reporte_inventario(1, id_bodega=1, estado="AGOTADO")


def test_filtro_por_material_quita_espacios_y_usa_comodines(inventario):
    reporte = reportes_service.generar_reporte_inventario(1, id_bodega=1, material="  cem  ")

    assert inventario["consultas"] == [([1], "%cem%")]
    assert reporte["filtros"]["material"] == "cem"


def test_filtro_por_material_solo_espacios_se_ignora(inventario):
    reporte = reportes_service.generar_reporte_inventario(1, id_bodega=1, material="   ")

    assert inventario["consultas"] == [([1], None)]
    assert reporte["filtros"]["material"] is None


# ============================================================
# Service: generar_reporte_movimientos
# ============================================================

@pytest.fixture
def historial(monkeypatch):
    estado = {"acceso": {"nombre": "Central"}, "consultas": []}

    monkeypatch.setattr(reportes_service, "obtener_bodega_con_acceso", lambda u, b: estado["acceso"])
    monkeypatch.setattr(reportes_service, "obtener_proyecto_con_acceso", lambda u, p: estado["acceso"])

    def consultar(**datos):
        estado["consultas"].append(datos)
        return [{"id_movimiento": 1}]

    monkeypatch.setattr(reportes_service, "consultar_historial", consultar)
    return estado


def test_historial_por_bodega_con_filtros(historial):
    resultado = reportes_service.generar_reporte_movimientos(
        1, id_bodega=1, fecha_desde=date(2026, 11, 1), fecha_hasta=date(2026, 11, 30),
        tipo="ENTRADA", material="  cemento ",
    )

    assert resultado == {"movimientos": [{"id_movimiento": 1}]}
    assert historial["consultas"][0] == {
        "id_bodega": 1, "id_proyecto": None,
        "fecha_desde": date(2026, 11, 1), "fecha_hasta": date(2026, 11, 30),
        "tipo": "ENTRADA", "material": "cemento",
    }


def test_historial_sin_material_envia_texto_vacio(historial):
    reportes_service.generar_reporte_movimientos(1, id_proyecto=7)

    assert historial["consultas"][0]["material"] == ""


def test_historial_misma_fecha_desde_y_hasta_es_valido(historial):
    dia = date(2026, 11, 4)

    reportes_service.generar_reporte_movimientos(1, id_bodega=1, fecha_desde=dia, fecha_hasta=dia)

    assert len(historial["consultas"]) == 1


def test_historial_fecha_inicial_mayor_que_final(historial):
    with pytest.raises(ValueError, match="fecha inicial"):
        reportes_service.generar_reporte_movimientos(
            1, id_bodega=1, fecha_desde=date(2026, 12, 1), fecha_hasta=date(2026, 11, 1)
        )


@pytest.mark.parametrize("kwargs", [{}, {"id_bodega": 1, "id_proyecto": 7}])
def test_historial_exactamente_un_contexto(historial, kwargs):
    with pytest.raises(ValueError, match="exactamente una"):
        reportes_service.generar_reporte_movimientos(1, **kwargs)


def test_historial_sin_acceso(historial):
    historial["acceso"] = None

    with pytest.raises(SinAccesoContexto):
        reportes_service.generar_reporte_movimientos(1, id_bodega=1)

    assert historial["consultas"] == []


# ============================================================
# Router
# ============================================================

@pytest.mark.parametrize("ruta", ["/reportes/inventario", "/reportes/movimientos"])
def test_router_encargado_no_puede_ver_reportes(client, autenticar_como, ruta):
    autenticar_como("Encargado")

    assert client.get(ruta, params={"id_bodega": 1}).status_code == 403


@pytest.mark.parametrize("rol", ["Jefe de Bodega", "Jefa de Construcción"])
def test_router_inventario_roles_permitidos(client, autenticar_como, monkeypatch, rol):
    autenticar_como(rol, id_usuario=4)
    recibido = {}

    def falso(**datos):
        recibido.update(datos)
        return {"materiales": []}

    monkeypatch.setattr(reportes_router, "generar_reporte_inventario", falso)

    respuesta = client.get(
        "/reportes/inventario",
        params={"id_bodega": 1, "material": "cem", "estado": "OK"},
    )

    assert respuesta.status_code == 200
    assert recibido == {
        "id_usuario": 4, "id_bodega": 1, "id_proyecto": None, "material": "cem", "estado": "OK"
    }


@pytest.mark.parametrize("error, codigo", [
    (SinAccesoContexto("No tiene acceso a la bodega o proyecto indicado."), 403),
    (ValueError("Indique id_bodega o id_proyecto (solo uno de los dos)."), 400),
])
def test_router_inventario_traduce_errores(client, autenticar_como, monkeypatch, error, codigo):
    autenticar_como("Jefe de Bodega")

    def falso(**datos):
        raise error

    monkeypatch.setattr(reportes_router, "generar_reporte_inventario", falso)

    respuesta = client.get("/reportes/inventario", params={"id_bodega": 1})

    assert respuesta.status_code == codigo
    assert respuesta.json()["detail"] == str(error)


def test_router_id_bodega_cero_devuelve_422(client, autenticar_como):
    autenticar_como("Jefe de Bodega")

    assert client.get("/reportes/inventario", params={"id_bodega": 0}).status_code == 422


def test_router_movimientos_convierte_fechas(client, autenticar_como, monkeypatch):
    autenticar_como("Jefa de Construcción", id_usuario=4)
    recibido = {}

    def falso(**datos):
        recibido.update(datos)
        return {"movimientos": []}

    monkeypatch.setattr(reportes_router, "generar_reporte_movimientos", falso)

    respuesta = client.get("/reportes/movimientos", params={
        "id_proyecto": 7, "fecha_desde": "2026-11-01", "fecha_hasta": "2026-11-30", "tipo": "SALIDA",
    })

    assert respuesta.status_code == 200
    assert recibido["fecha_desde"] == date(2026, 11, 1)
    assert recibido["fecha_hasta"] == date(2026, 11, 30)
    assert recibido["tipo"] == "SALIDA"


def test_router_movimientos_tipo_invalido_devuelve_422(client, autenticar_como):
    autenticar_como("Jefe de Bodega")

    respuesta = client.get("/reportes/movimientos", params={"id_bodega": 1, "tipo": "AJUSTE"})

    assert respuesta.status_code == 422


def test_router_movimientos_fecha_mal_escrita_devuelve_422(client, autenticar_como):
    autenticar_como("Jefe de Bodega")

    respuesta = client.get("/reportes/movimientos", params={"id_bodega": 1, "fecha_desde": "04/11/2026"})

    assert respuesta.status_code == 422


@pytest.mark.parametrize("error, codigo", [
    (SinAccesoContexto("No tiene acceso a la bodega o proyecto indicado."), 403),
    (ValueError("La fecha inicial no puede superar la fecha final."), 400),
])
def test_router_movimientos_traduce_errores(client, autenticar_como, monkeypatch, error, codigo):
    autenticar_como("Jefe de Bodega")

    def falso(**datos):
        raise error

    monkeypatch.setattr(reportes_router, "generar_reporte_movimientos", falso)

    assert client.get("/reportes/movimientos", params={"id_bodega": 1}).status_code == codigo


# ============================================================
# Repository
# ============================================================

def test_repository_bodega_con_acceso(motor_falso):
    motor = motor_falso(reportes_repository, [[Fila(id_bodega=1, nombre="Central")]])

    assert reportes_repository.obtener_bodega_con_acceso(4, 1) == {"id_bodega": 1, "nombre": "Central"}
    assert motor.parametros[0] == {"id_usuario": 4, "id_bodega": 1}


def test_repository_bodega_sin_acceso(motor_falso):
    motor_falso(reportes_repository, [[]])

    assert reportes_repository.obtener_bodega_con_acceso(4, 1) is None


def test_repository_proyecto_sin_acceso(motor_falso):
    motor_falso(reportes_repository, [[]])

    assert reportes_repository.obtener_proyecto_con_acceso(4, 7) is None


def test_repository_ids_bodegas_de_proyecto(motor_falso):
    motor_falso(reportes_repository, [[Fila(id_bodega=1), Fila(id_bodega=3)]])

    assert reportes_repository.obtener_ids_bodegas_de_proyecto(7) == [1, 3]


def test_repository_inventario_actual_con_busqueda(motor_falso):
    motor = motor_falso(reportes_repository, [[]])

    reportes_repository.consultar_inventario_actual([1, 2], "%cem%")

    assert "ILIKE :buscar" in motor.sql[0]
    assert motor.parametros[0] == {"ids_bodega": [1, 2], "buscar": "%cem%"}


def test_repository_inventario_actual_sin_busqueda(motor_falso):
    motor = motor_falso(reportes_repository, [[]])

    reportes_repository.consultar_inventario_actual((1,))

    assert "ILIKE" not in motor.sql[0]
    assert motor.parametros[0] == {"ids_bodega": [1]}


def test_repository_historial_por_bodega_mira_origen_y_destino(motor_falso):
    motor = motor_falso(reportes_repository, [[]])

    reportes_repository.consultar_historial(1, None, None, None, None, "")

    sql = motor.sql[0]
    assert ":id_bodega IN (mov.id_bodega_origen, mov.id_bodega_destino)" in sql
    assert motor.parametros[0] == {"id_bodega": 1}
    assert "ORDER BY mov.fecha_movimiento DESC" in sql


def test_repository_historial_por_proyecto_con_todos_los_filtros(motor_falso):
    motor = motor_falso(reportes_repository, [[]])

    reportes_repository.consultar_historial(
        None, 7, date(2026, 11, 1), date(2026, 11, 30), "SALIDA", "cem"
    )

    sql = motor.sql[0]
    assert "mov.id_proyecto = :id_proyecto" in sql
    assert "mov.fecha_movimiento >= :fecha_desde" in sql
    # La fecha final incluye todo el día
    assert "INTERVAL '1 day'" in sql
    assert "mov.tipo = :tipo" in sql
    assert motor.parametros[0] == {
        "id_proyecto": 7,
        "fecha_desde": date(2026, 11, 1),
        "fecha_hasta": date(2026, 11, 30),
        "tipo": "SALIDA",
        "material": "%cem%",
    }
