# Pruebas unitarias del módulo solicitudes.
# Cubre: registrar (RN-07, RN-08, RN-11), consultar por rol (H-05.1),
# aprobar/rechazar con notificación (RN-25), agregar materiales (H-04.1),
# listar aprobadas y confirmar recepción (H-12.3).

from datetime import datetime

import pytest

from app.modules.solicitudes import repository as solicitudes_repository
from app.modules.solicitudes import router as solicitudes_router
from app.modules.solicitudes import service as solicitudes_service
from app.modules.solicitudes.service import (
    SinPermisoSobreSolicitud,
    SolicitudNoEncontrada,
)

from tests.unit.bd_falsa import Fila, MotorFalso


FECHA = datetime(2026, 11, 4, 9, 30)


# ============================================================
# registrar_solicitud
# ============================================================

@pytest.fixture
def registro(monkeypatch):
    estado = {
        "bodegas": {1, 2},
        "materiales": {10, 11},
        "cabeceras": [],
        "detalles": [],
    }

    monkeypatch.setattr(solicitudes_service, "existe_bodega", lambda i: i in estado["bodegas"])
    monkeypatch.setattr(solicitudes_service, "existe_material", lambda i: i in estado["materiales"])

    def crear_falso(**datos):
        estado["cabeceras"].append(datos)
        return {"id_solicitud": 50, "fecha_solicitud": FECHA}

    def detalle_falso(**datos):
        estado["detalles"].append(datos)

    monkeypatch.setattr(solicitudes_service, "crear_solicitud", crear_falso)
    monkeypatch.setattr(solicitudes_service, "crear_detalle_solicitud", detalle_falso)
    return estado


def _registrar(origen=2, destino=1, materiales=None, prioridad="ALTA"):
    if materiales is None:
        materiales = [{"id_material": 10, "cantidad": 5}, {"id_material": 11, "cantidad": 1}]
    return solicitudes_service.registrar_solicitud(
        id_usuario=3,
        id_bodega_origen=origen,
        id_bodega_destino=destino,
        prioridad=prioridad,
        materiales=materiales,
    )


def test_registrar_solicitud_valida(registro):
    resultado = _registrar()

    assert resultado["id_solicitud"] == 50
    assert resultado["estado"] == "PENDIENTE"
    assert resultado["fecha_solicitud"] == str(FECHA)
    assert resultado["prioridad"] == "ALTA"
    assert registro["cabeceras"] == [{
        "id_bodega_origen": 2, "id_bodega_destino": 1, "prioridad": "ALTA", "id_usuario": 3
    }]
    assert registro["detalles"] == [
        {"id_solicitud": 50, "id_material": 10, "cantidad": 5},
        {"id_solicitud": 50, "id_material": 11, "cantidad": 1},
    ]


def test_rn07_bodega_origen_igual_a_destino(registro):
    with pytest.raises(ValueError, match="distinta"):
        _registrar(origen=1, destino=1)

    assert registro["cabeceras"] == []


def test_bodega_origen_inexistente(registro):
    with pytest.raises(ValueError, match="origen no existe"):
        _registrar(origen=99)


def test_bodega_destino_inexistente(registro):
    with pytest.raises(ValueError, match="destino no existe"):
        _registrar(destino=99)


def test_rn08_sin_materiales(registro):
    with pytest.raises(ValueError, match="al menos un material"):
        _registrar(materiales=[])

    assert registro["cabeceras"] == []


@pytest.mark.parametrize("cantidad", [0, -2])
def test_rn11_cantidad_invalida(registro, cantidad):
    with pytest.raises(ValueError, match="mayor que cero"):
        _registrar(materiales=[{"id_material": 10, "cantidad": cantidad}])

    assert registro["cabeceras"] == []


def test_material_inexistente(registro):
    with pytest.raises(ValueError, match="material 77 no existe"):
        _registrar(materiales=[{"id_material": 77, "cantidad": 1}])

    assert registro["cabeceras"] == []


# ============================================================
# obtener_solicitudes (H-05.1)
# ============================================================

CABECERA = {
    "id_solicitud": 1, "fecha_solicitud": FECHA, "estado": "PENDIENTE", "prioridad": "MEDIA",
    "id_bodega_origen": 2, "id_bodega_destino": 1, "bodega_origen": "Satélite",
    "bodega_destino": "Central", "solicitante": "Ana",
}


@pytest.fixture
def consulta(monkeypatch):
    llamadas = []

    def del_solicitante(id_usuario, estado):
        llamadas.append(("solicitante", id_usuario, estado))
        return [CABECERA, {**CABECERA, "id_solicitud": 2}]

    def de_mis_bodegas(id_usuario, estado):
        llamadas.append(("bodegas", id_usuario, estado))
        return [CABECERA]

    def materiales(ids):
        llamadas.append(("materiales", ids))
        return [
            {"id_solicitud": 1, "id_material": 10, "nombre": "Cemento", "tipo": "A", "cantidad": 5},
            {"id_solicitud": 2, "id_material": 11, "nombre": "Arena", "tipo": "B", "cantidad": 2},
        ]

    monkeypatch.setattr(solicitudes_service, "listar_solicitudes_del_solicitante", del_solicitante)
    monkeypatch.setattr(solicitudes_service, "listar_solicitudes_de_mis_bodegas", de_mis_bodegas)
    monkeypatch.setattr(solicitudes_service, "listar_materiales_de_solicitudes", materiales)
    return llamadas


def test_encargado_ve_solo_sus_solicitudes(consulta):
    resultado = solicitudes_service.obtener_solicitudes(3, "Encargado")

    assert consulta[0] == ("solicitante", 3, None)
    assert [s["id_solicitud"] for s in resultado] == [1, 2]


def test_jefe_de_bodega_ve_las_de_sus_bodegas(consulta):
    solicitudes_service.obtener_solicitudes(4, "Jefe de Bodega")

    assert consulta[0] == ("bodegas", 4, None)


def test_cada_solicitud_lleva_solo_sus_materiales(consulta):
    resultado = solicitudes_service.obtener_solicitudes(3, "Encargado")

    assert resultado[0]["materiales"] == [
        {"id_material": 10, "nombre": "Cemento", "tipo": "A", "cantidad": 5}
    ]
    assert resultado[1]["materiales"] == [
        {"id_material": 11, "nombre": "Arena", "tipo": "B", "cantidad": 2}
    ]
    assert resultado[0]["fecha_solicitud"] == FECHA.isoformat()


def test_el_estado_se_normaliza_a_mayusculas(consulta):
    solicitudes_service.obtener_solicitudes(3, "Encargado", estado="pendiente")

    assert consulta[0] == ("solicitante", 3, "PENDIENTE")


def test_estado_invalido(consulta):
    with pytest.raises(ValueError, match="estado indicado no es válido"):
        solicitudes_service.obtener_solicitudes(3, "Encargado", estado="PERDIDA")

    assert consulta == []


@pytest.mark.parametrize("rol", ["Administrador", "Jefa de Construcción"])
def test_rol_sin_acceso_a_solicitudes(consulta, rol):
    with pytest.raises(ValueError, match="no puede consultar"):
        solicitudes_service.obtener_solicitudes(3, rol)


# ============================================================
# cambiar_estado_solicitud (aprobar / rechazar + RN-25)
# ============================================================

@pytest.fixture
def decision(monkeypatch):
    estado = {
        "solicitud": {"id_solicitud": 5, "estado": "PENDIENTE", "id_usuario": 3},
        "actualizados": [],
        "notificaciones": [],
    }

    monkeypatch.setattr(solicitudes_service, "obtener_solicitud_por_id", lambda _id: estado["solicitud"])
    monkeypatch.setattr(
        solicitudes_service, "actualizar_estado_solicitud",
        lambda id_s, nuevo: estado["actualizados"].append((id_s, nuevo)),
    )
    monkeypatch.setattr(
        solicitudes_service, "registrar_notificacion",
        lambda **datos: estado["notificaciones"].append(datos),
    )
    return estado


def test_aprobar_cambia_estado_y_notifica_al_solicitante(decision):
    resultado = solicitudes_service.cambiar_estado_solicitud(5, "APROBADA")

    assert resultado == {
        "id_solicitud": 5, "estado": "APROBADA", "mensaje": "Estado actualizado correctamente"
    }
    assert decision["actualizados"] == [(5, "APROBADA")]
    notificacion = decision["notificaciones"][0]
    assert notificacion["id_usuario"] == 3
    assert notificacion["tipo"] == "CAMBIO_ESTADO"
    assert notificacion["titulo"] == "Solicitud Aprobada"


def test_rechazar_con_motivo_lo_incluye_en_la_notificacion(decision):
    solicitudes_service.cambiar_estado_solicitud(5, "RECHAZADA", "Sin presupuesto")

    mensaje = decision["notificaciones"][0]["mensaje"]
    assert "rechazada" in mensaje
    assert "Motivo: Sin presupuesto" in mensaje


def test_rechazar_sin_motivo(decision):
    solicitudes_service.cambiar_estado_solicitud(5, "RECHAZADA")

    assert "Motivo" not in decision["notificaciones"][0]["mensaje"]


def test_solicitud_inexistente(decision):
    decision["solicitud"] = None

    with pytest.raises(ValueError, match="no existe"):
        solicitudes_service.cambiar_estado_solicitud(5, "APROBADA")

    assert decision["actualizados"] == []


@pytest.mark.parametrize("estado_actual", ["APROBADA", "RECHAZADA", "EN_TRANSITO", "COMPLETADA"])
def test_decision_unica_solo_sobre_pendientes(decision, estado_actual):
    decision["solicitud"]["estado"] = estado_actual

    with pytest.raises(ValueError, match="ya fue procesada"):
        solicitudes_service.cambiar_estado_solicitud(5, "APROBADA")

    assert decision["actualizados"] == []
    assert decision["notificaciones"] == []


# ============================================================
# agregar_materiales_a_solicitud (H-04.1)
# ============================================================

@pytest.fixture
def agregar(monkeypatch):
    estado = {
        "solicitud": {"id_solicitud": 5, "estado": "PENDIENTE", "id_usuario": 3},
        "en_listado": [10],
        "existentes": {10, 11, 12},
        "guardados": [],
    }

    monkeypatch.setattr(solicitudes_service, "obtener_solicitud_por_id", lambda _id: estado["solicitud"])
    monkeypatch.setattr(solicitudes_service, "obtener_ids_materiales_de_solicitud", lambda _id: estado["en_listado"])
    monkeypatch.setattr(solicitudes_service, "existe_material", lambda i: i in estado["existentes"])
    monkeypatch.setattr(
        solicitudes_service, "agregar_detalles_solicitud",
        lambda id_s, materiales: estado["guardados"].append((id_s, materiales)),
    )
    monkeypatch.setattr(
        solicitudes_service, "listar_materiales_de_solicitudes",
        lambda ids: [
            {"id_solicitud": 5, "id_material": 10, "nombre": "Cemento", "tipo": "A", "cantidad": 5},
            {"id_solicitud": 5, "id_material": 11, "nombre": "Arena", "tipo": "B", "cantidad": 2},
        ],
    )
    return estado


def test_agregar_materiales_correctamente(agregar):
    nuevos = [{"id_material": 11, "cantidad": 2}]

    resultado = solicitudes_service.agregar_materiales_a_solicitud(3, 5, nuevos)

    assert agregar["guardados"] == [(5, nuevos)]
    assert resultado["total_items"] == 2
    assert resultado["estado"] == "PENDIENTE"
    assert [m["id_material"] for m in resultado["materiales"]] == [10, 11]


def test_agregar_a_solicitud_inexistente(agregar):
    agregar["solicitud"] = None

    with pytest.raises(SolicitudNoEncontrada):
        solicitudes_service.agregar_materiales_a_solicitud(3, 5, [{"id_material": 11, "cantidad": 1}])


def test_solo_el_dueno_puede_agregar(agregar):
    with pytest.raises(SinPermisoSobreSolicitud):
        solicitudes_service.agregar_materiales_a_solicitud(99, 5, [{"id_material": 11, "cantidad": 1}])

    assert agregar["guardados"] == []


def test_solo_se_agrega_a_pendientes(agregar):
    agregar["solicitud"]["estado"] = "APROBADA"

    with pytest.raises(ValueError, match="pendientes"):
        solicitudes_service.agregar_materiales_a_solicitud(3, 5, [{"id_material": 11, "cantidad": 1}])


def test_agregar_lista_vacia(agregar):
    with pytest.raises(ValueError, match="al menos un material"):
        solicitudes_service.agregar_materiales_a_solicitud(3, 5, [])


def test_agregar_cantidad_invalida(agregar):
    with pytest.raises(ValueError, match="mayor que cero"):
        solicitudes_service.agregar_materiales_a_solicitud(3, 5, [{"id_material": 11, "cantidad": 0}])

    assert agregar["guardados"] == []


def test_agregar_material_inexistente(agregar):
    with pytest.raises(ValueError, match="no existe"):
        solicitudes_service.agregar_materiales_a_solicitud(3, 5, [{"id_material": 77, "cantidad": 1}])


def test_no_se_repite_un_material_que_ya_esta_en_el_listado(agregar):
    with pytest.raises(ValueError, match="ya está en el listado"):
        solicitudes_service.agregar_materiales_a_solicitud(3, 5, [{"id_material": 10, "cantidad": 1}])


def test_no_se_repite_un_material_dentro_del_mismo_envio(agregar):
    repetidos = [{"id_material": 11, "cantidad": 1}, {"id_material": 11, "cantidad": 3}]

    with pytest.raises(ValueError, match="ya está en el listado"):
        solicitudes_service.agregar_materiales_a_solicitud(3, 5, repetidos)

    # Si uno falla no se guarda ninguno
    assert agregar["guardados"] == []


# ============================================================
# listar aprobadas y confirmar recepción (H-12.3)
# ============================================================

def test_listar_solicitudes_aprobadas(monkeypatch):
    monkeypatch.setattr(solicitudes_service, "obtener_solicitudes_aprobadas", lambda: [{"id_solicitud": 1}])

    assert solicitudes_service.listar_solicitudes_aprobadas() == [{"id_solicitud": 1}]


@pytest.fixture
def recepcion(monkeypatch):
    estado = {
        "solicitud": {"id_solicitud": 5, "estado": "EN_TRANSITO", "id_bodega_destino": 2},
        "es_encargado": True,
        "entradas": [],
        "cerradas": [],
    }

    monkeypatch.setattr(solicitudes_service, "obtener_solicitud_por_id", lambda _id: estado["solicitud"])
    monkeypatch.setattr(
        solicitudes_service, "verificar_usuario_en_bodega",
        lambda id_usuario, id_bodega: estado["es_encargado"],
    )
    monkeypatch.setattr(
        solicitudes_service, "actualizar_inventario",
        lambda **datos: estado["entradas"].append(datos),
    )
    monkeypatch.setattr(
        solicitudes_service, "actualizar_estado_solicitud_y_pedido",
        lambda id_s, nuevo: estado["cerradas"].append((id_s, nuevo)),
    )
    motor = MotorFalso([[
        Fila(id_material=10, cantidad_solicitada=5),
        Fila(id_material=11, cantidad_solicitada=2),
    ]])
    monkeypatch.setattr(solicitudes_service, "engine", motor)
    return estado


def test_confirmar_recepcion_suma_stock_y_completa(recepcion):
    resultado = solicitudes_service.confirmar_recepcion_pedido(5, id_usuario=3)

    assert resultado["mensaje"].startswith("Pedido recibido")
    assert recepcion["entradas"] == [
        {"id_bodega": 2, "id_material": 10, "cantidad": 5, "tipo_movimiento": "ENTRADA"},
        {"id_bodega": 2, "id_material": 11, "cantidad": 2, "tipo_movimiento": "ENTRADA"},
    ]
    assert recepcion["cerradas"] == [(5, "COMPLETADA")]


def test_confirmar_recepcion_solicitud_inexistente(recepcion):
    recepcion["solicitud"] = None

    with pytest.raises(ValueError, match="no existe"):
        solicitudes_service.confirmar_recepcion_pedido(5, id_usuario=3)


@pytest.mark.parametrize("estado", ["PENDIENTE", "APROBADA", "COMPLETADA"])
def test_confirmar_recepcion_solo_en_transito(recepcion, estado):
    recepcion["solicitud"]["estado"] = estado

    with pytest.raises(ValueError, match="no está en tránsito"):
        solicitudes_service.confirmar_recepcion_pedido(5, id_usuario=3)

    assert recepcion["entradas"] == []


def test_confirmar_recepcion_solo_el_encargado_de_la_bodega_destino(recepcion):
    recepcion["es_encargado"] = False

    with pytest.raises(ValueError, match="Acceso denegado"):
        solicitudes_service.confirmar_recepcion_pedido(5, id_usuario=99)

    assert recepcion["entradas"] == []
    assert recepcion["cerradas"] == []


# ============================================================
# Router
# ============================================================

BODY_SOLICITUD = {
    "id_bodega_origen": 2,
    "id_bodega_destino": 1,
    "materiales": [{"id_material": 10, "cantidad": 5}],
}


def test_router_crear_solicitud_requiere_token(client):
    assert client.post("/solicitudes/", json=BODY_SOLICITUD).status_code == 401


def test_router_crear_solicitud_prioridad_por_defecto_media(client, autenticar_como, monkeypatch):
    autenticar_como("Encargado", id_usuario=3)
    recibido = {}

    def falso(**datos):
        recibido.update(datos)
        return {"id_solicitud": 50}

    monkeypatch.setattr(solicitudes_router, "registrar_solicitud", falso)

    respuesta = client.post("/solicitudes/", json=BODY_SOLICITUD)

    assert respuesta.status_code == 200
    assert recibido["prioridad"] == "MEDIA"
    assert recibido["id_usuario"] == 3
    assert recibido["materiales"] == [{"id_material": 10, "cantidad": 5}]


def test_router_crear_solicitud_regla_incumplida_devuelve_400(client, autenticar_como, monkeypatch):
    autenticar_como("Encargado")

    def falso(**datos):
        raise ValueError("La bodega de origen debe ser distinta a la de destino.")

    monkeypatch.setattr(solicitudes_router, "registrar_solicitud", falso)

    assert client.post("/solicitudes/", json=BODY_SOLICITUD).status_code == 400


def test_router_crear_solicitud_cantidad_cero_devuelve_422(client, autenticar_como):
    autenticar_como("Encargado")
    body = {**BODY_SOLICITUD, "materiales": [{"id_material": 10, "cantidad": 0}]}

    assert client.post("/solicitudes/", json=body).status_code == 422


@pytest.mark.parametrize("rol", ["Encargado", "Jefe de Bodega"])
def test_router_listar_solicitudes_roles_permitidos(client, autenticar_como, monkeypatch, rol):
    autenticar_como(rol, id_usuario=4)
    recibido = {}

    def falso(**datos):
        recibido.update(datos)
        return []

    monkeypatch.setattr(solicitudes_router, "obtener_solicitudes", falso)

    respuesta = client.get("/solicitudes/", params={"estado": "PENDIENTE"})

    assert respuesta.status_code == 200
    assert recibido == {"id_usuario": 4, "rol": rol, "estado": "PENDIENTE"}


def test_router_listar_solicitudes_estado_invalido_devuelve_400(client, autenticar_como, monkeypatch):
    autenticar_como("Encargado")

    def falso(**datos):
        raise ValueError("El estado indicado no es válido.")

    monkeypatch.setattr(solicitudes_router, "obtener_solicitudes", falso)

    respuesta = client.get("/solicitudes/", params={"estado": "X"})

    assert respuesta.status_code == 400
    assert respuesta.json()["detail"] == "El estado indicado no es válido."


def test_router_listar_solicitudes_jefa_de_construccion_403(client, autenticar_como):
    autenticar_como("Jefa de Construcción")

    assert client.get("/solicitudes/").status_code == 403


def test_router_aprobar_solo_jefe_de_bodega(client, autenticar_como, monkeypatch):
    monkeypatch.setattr(
        solicitudes_router, "cambiar_estado_solicitud",
        lambda id_s, estado, motivo=None: {"id_solicitud": id_s, "estado": estado},
    )

    autenticar_como("Encargado")
    assert client.put("/solicitudes/5/aprobar").status_code == 403

    autenticar_como("Jefe de Bodega")
    respuesta = client.put("/solicitudes/5/aprobar")
    assert respuesta.status_code == 200
    assert respuesta.json() == {"id_solicitud": 5, "estado": "APROBADA"}


def test_router_rechazar_envia_el_motivo(client, autenticar_como, monkeypatch):
    autenticar_como("Jefe de Bodega")
    recibido = {}

    def falso(id_s, estado, motivo=None):
        recibido.update(id=id_s, estado=estado, motivo=motivo)
        return {}

    monkeypatch.setattr(solicitudes_router, "cambiar_estado_solicitud", falso)

    respuesta = client.put("/solicitudes/5/rechazar", json={"motivo": "Duplicada"})

    assert respuesta.status_code == 200
    assert recibido == {"id": 5, "estado": "RECHAZADA", "motivo": "Duplicada"}


def test_router_aprobar_solicitud_ya_procesada_devuelve_400(client, autenticar_como, monkeypatch):
    autenticar_como("Jefe de Bodega")

    def falso(*args):
        raise ValueError("La solicitud ya fue procesada (Estado actual: APROBADA).")

    monkeypatch.setattr(solicitudes_router, "cambiar_estado_solicitud", falso)

    assert client.put("/solicitudes/5/aprobar").status_code == 400


def test_router_rechazar_solicitud_ya_procesada_devuelve_400(client, autenticar_como, monkeypatch):
    autenticar_como("Jefe de Bodega")

    def falso(*args):
        raise ValueError("La solicitud ya fue procesada (Estado actual: RECHAZADA).")

    monkeypatch.setattr(solicitudes_router, "cambiar_estado_solicitud", falso)

    assert client.put("/solicitudes/5/rechazar", json={}).status_code == 400


@pytest.mark.parametrize("error, codigo", [
    (SolicitudNoEncontrada("La solicitud no existe."), 404),
    (SinPermisoSobreSolicitud("Solo quien creó la solicitud puede modificar su listado."), 403),
    (ValueError("Solo se pueden agregar materiales a solicitudes pendientes."), 400),
])
def test_router_agregar_materiales_traduce_errores(client, autenticar_como, monkeypatch, error, codigo):
    autenticar_como("Encargado")

    def falso(**datos):
        raise error

    monkeypatch.setattr(solicitudes_router, "agregar_materiales_a_solicitud", falso)

    respuesta = client.post(
        "/solicitudes/5/materiales",
        json={"materiales": [{"id_material": 11, "cantidad": 1}]},
    )

    assert respuesta.status_code == codigo
    assert respuesta.json()["detail"] == str(error)


def test_router_agregar_materiales_solo_encargado(client, autenticar_como):
    autenticar_como("Jefe de Bodega")

    respuesta = client.post(
        "/solicitudes/5/materiales",
        json={"materiales": [{"id_material": 11, "cantidad": 1}]},
    )

    assert respuesta.status_code == 403


def test_router_aprobadas_solo_jefe_de_bodega(client, autenticar_como, monkeypatch):
    monkeypatch.setattr(solicitudes_router, "listar_solicitudes_aprobadas", lambda: [{"id_solicitud": 1}])

    autenticar_como("Encargado")
    assert client.get("/solicitudes/aprobadas").status_code == 403

    autenticar_como("Jefe de Bodega")
    respuesta = client.get("/solicitudes/aprobadas")
    assert respuesta.status_code == 200
    assert respuesta.json() == [{"id_solicitud": 1}]


def test_router_aprobadas_error_devuelve_400(client, autenticar_como, monkeypatch):
    autenticar_como("Jefe de Bodega")

    def falso():
        raise ValueError("Error al consultar")

    monkeypatch.setattr(solicitudes_router, "listar_solicitudes_aprobadas", falso)

    assert client.get("/solicitudes/aprobadas").status_code == 400


def test_router_recibir_pedido_usa_el_usuario_del_token(client, autenticar_como, monkeypatch):
    autenticar_como("Encargado", id_usuario=3)
    recibido = {}

    def falso(**datos):
        recibido.update(datos)
        return {"mensaje": "ok"}

    monkeypatch.setattr(solicitudes_router, "confirmar_recepcion_pedido", falso)

    respuesta = client.put("/solicitudes/5/recibir")

    assert respuesta.status_code == 200
    assert recibido == {"id_solicitud": 5, "id_usuario": 3}


def test_router_recibir_pedido_error_devuelve_400(client, autenticar_como, monkeypatch):
    autenticar_como("Encargado")

    def falso(**datos):
        raise ValueError("La solicitud no está en tránsito, no se puede recibir.")

    monkeypatch.setattr(solicitudes_router, "confirmar_recepcion_pedido", falso)

    assert client.put("/solicitudes/5/recibir").status_code == 400


# ============================================================
# Repository
# ============================================================

def test_repository_crear_solicitud_inicia_pendiente(motor_falso):
    motor = motor_falso(solicitudes_repository, [[Fila(id_solicitud=50, fecha_solicitud=FECHA)]])

    resultado = solicitudes_repository.crear_solicitud(2, 1, "ALTA", 3)

    assert resultado == {"id_solicitud": 50, "fecha_solicitud": FECHA}
    assert "'PENDIENTE'" in motor.sql[0]
    assert motor.transacciones == 1


def test_repository_consulta_filtra_por_estado_si_viene(motor_falso):
    motor = motor_falso(solicitudes_repository, [[Fila(**CABECERA)]])

    resultado = solicitudes_repository.listar_solicitudes_del_solicitante(3, "PENDIENTE")

    assert resultado == [CABECERA]
    assert "s.estado = :estado" in motor.sql[0]
    assert motor.parametros[0] == {"id_usuario": 3, "estado": "PENDIENTE"}


def test_repository_consulta_sin_estado_no_filtra(motor_falso):
    motor = motor_falso(solicitudes_repository, [[]])

    solicitudes_repository.listar_solicitudes_de_mis_bodegas(4)

    assert "s.estado = :estado" not in motor.sql[0]
    assert "usuario_bodega" in motor.sql[0]


def test_repository_materiales_de_lista_vacia_no_consulta(motor_falso):
    motor = motor_falso(solicitudes_repository)

    assert solicitudes_repository.listar_materiales_de_solicitudes([]) == []
    assert motor.ejecutadas == []


def test_repository_agregar_detalles_en_una_transaccion(motor_falso):
    motor = motor_falso(solicitudes_repository)

    solicitudes_repository.agregar_detalles_solicitud(
        5, [{"id_material": 10, "cantidad": 1}, {"id_material": 11, "cantidad": 2}]
    )

    assert motor.transacciones == 1
    assert len(motor.ejecutadas) == 2


def test_repository_aprobadas_incluye_sus_materiales(motor_falso):
    motor_falso(solicitudes_repository, [
        [Fila(id_solicitud=1, fecha_solicitud=FECHA, estado="APROBADA", prioridad="MEDIA",
              bodega_origen="S", bodega_destino="C", solicitante="Ana")],
        [Fila(id_material=10, material="Cemento", cantidad=5)],
    ])

    resultado = solicitudes_repository.obtener_solicitudes_aprobadas()

    assert resultado[0]["materiales"] == [{"id_material": 10, "material": "Cemento", "cantidad": 5}]


@pytest.mark.parametrize("filas, esperado", [([Fila(x=1)], True), ([], False)])
def test_repository_verificar_usuario_en_bodega(motor_falso, filas, esperado):
    motor_falso(solicitudes_repository, [filas])

    assert solicitudes_repository.verificar_usuario_en_bodega(3, 2) is esperado


def test_repository_completar_actualiza_solicitud_y_pedido(motor_falso):
    motor = motor_falso(solicitudes_repository)

    solicitudes_repository.actualizar_estado_solicitud_y_pedido(5, "COMPLETADA")

    assert motor.transacciones == 1
    assert "UPDATE solicitud" in motor.sql[0]
    assert "UPDATE pedido" in motor.sql[1]


def test_repository_crear_detalle_solicitud(motor_falso):
    motor = motor_falso(solicitudes_repository)

    solicitudes_repository.crear_detalle_solicitud(5, 10, 3)

    assert motor.parametros[0] == {"id_solicitud": 5, "id_material": 10, "cantidad": 3}
    assert motor.transacciones == 1


@pytest.mark.parametrize("funcion", ["existe_material", "existe_bodega"])
@pytest.mark.parametrize("filas, esperado", [([Fila(x=1)], True), ([], False)])
def test_repository_existe(motor_falso, funcion, filas, esperado):
    motor_falso(solicitudes_repository, [filas])

    assert getattr(solicitudes_repository, funcion)(1) is esperado


def test_repository_materiales_de_varias_solicitudes(motor_falso):
    fila = Fila(id_solicitud=1, id_material=10, nombre="Cemento", tipo="A", cantidad=5)
    motor = motor_falso(solicitudes_repository, [[fila]])

    resultado = solicitudes_repository.listar_materiales_de_solicitudes((1, 2))

    assert resultado == [{"id_solicitud": 1, "id_material": 10, "nombre": "Cemento", "tipo": "A", "cantidad": 5}]
    assert motor.parametros[0] == {"ids": [1, 2]}


def test_repository_obtener_solicitud_por_id(motor_falso):
    motor_falso(solicitudes_repository, [[Fila(id_solicitud=5, estado="PENDIENTE")]])

    assert solicitudes_repository.obtener_solicitud_por_id(5) == {"id_solicitud": 5, "estado": "PENDIENTE"}


def test_repository_obtener_solicitud_inexistente(motor_falso):
    motor_falso(solicitudes_repository, [[]])

    assert solicitudes_repository.obtener_solicitud_por_id(999) is None


def test_repository_actualizar_estado_solicitud(motor_falso):
    motor = motor_falso(solicitudes_repository)

    solicitudes_repository.actualizar_estado_solicitud(5, "APROBADA")

    assert motor.parametros[0] == {"nuevo_estado": "APROBADA", "id_solicitud": 5}
    assert motor.transacciones == 1


def test_repository_ids_materiales_de_solicitud(motor_falso):
    motor_falso(solicitudes_repository, [[Fila(id_material=10), Fila(id_material=11)]])

    assert solicitudes_repository.obtener_ids_materiales_de_solicitud(5) == [10, 11]
