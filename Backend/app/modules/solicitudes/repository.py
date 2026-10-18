# Capa de acceso a datos - solicitudes.

#from sqlalchemy import text
from sqlalchemy import text, bindparam
from app.core.database import engine


def crear_solicitud(id_bodega_origen, id_bodega_destino, prioridad, id_usuario):
    #Inserta la cabecera de la solicitud y devuelve su ID
    with engine.begin() as connection:
        resultado = connection.execute(
            text("""
                INSERT INTO solicitud (
                    estado, prioridad, id_usuario, id_bodega_origen, id_bodega_destino
                )
                VALUES (
                    'PENDIENTE', :prioridad, :id_usuario, :id_bodega_origen, :id_bodega_destino
                )
                RETURNING id_solicitud, fecha_solicitud
            """),
            {
                "prioridad": prioridad,
                "id_usuario": id_usuario,
                "id_bodega_origen": id_bodega_origen,
                "id_bodega_destino": id_bodega_destino
            }
        )
        fila = resultado.fetchone()
        return {
            "id_solicitud": fila.id_solicitud,
            "fecha_solicitud": fila.fecha_solicitud
        }


def crear_detalle_solicitud(id_solicitud, id_material, cantidad):
    #Inserta un detalle de material en la solicitud
    with engine.begin() as connection:
        connection.execute(
            text("""
                INSERT INTO detalle_solicitud (id_solicitud, id_material, cantidad_solicitada)
                VALUES (:id_solicitud, :id_material, :cantidad)
            """),
            {
                "id_solicitud": id_solicitud,
                "id_material": id_material,
                "cantidad": cantidad
            }
        )


def existe_material(id_material):
    #Verifica que el material exista
    with engine.connect() as connection:
        resultado = connection.execute(
            text("SELECT id_material FROM material WHERE id_material = :id_material"),
            {"id_material": id_material}
        )
        return resultado.fetchone() is not None


def existe_bodega(id_bodega):
    #Verifica que la bodega exista
    with engine.connect() as connection:
        resultado = connection.execute(
            text("SELECT id_bodega FROM bodega WHERE id_bodega = :id_bodega"),
            {"id_bodega": id_bodega}
        )
        return resultado.fetchone() is not None


# H-05.1 - Consulta de solicitudes (GET /solicitudes)

def _consultar_solicitudes(condicion, parametros, estado=None):
    # Consulta las cabeceras de las solicitudes
    sql = """
        SELECT
            s.id_solicitud,
            s.fecha_solicitud,
            s.estado,
            s.prioridad,
            bo.nombre AS bodega_origen,
            bd.nombre AS bodega_destino,
            u.nombre AS solicitante
        FROM solicitud s
        JOIN bodega bo ON bo.id_bodega = s.id_bodega_origen
        JOIN bodega bd ON bd.id_bodega = s.id_bodega_destino
        JOIN usuario u ON u.id_usuario = s.id_usuario
        WHERE """ + condicion

    if estado:
        sql += " AND s.estado = :estado"
        parametros["estado"] = estado

    sql += " ORDER BY s.fecha_solicitud DESC"

    with engine.connect() as connection:
        resultado = connection.execute(text(sql), parametros)
        return [dict(fila._mapping) for fila in resultado]


def listar_solicitudes_del_solicitante(id_usuario, estado=None):
    # Encargado: solo las solicitudes que el mismo creo
    return _consultar_solicitudes(
        "s.id_usuario = :id_usuario",
        {"id_usuario": id_usuario},
        estado
    )


def listar_solicitudes_de_mis_bodegas(id_usuario, estado=None):
    # Jefe de Bodega: las solicitudes dirigidas a las bodegas que le pertenecen
    return _consultar_solicitudes(
        """s.id_bodega_destino IN (
            SELECT id_bodega FROM usuario_bodega WHERE id_usuario = :id_usuario
        )""",
        {"id_usuario": id_usuario},
        estado
    )


def listar_materiales_de_solicitudes(ids_solicitud):
    # Devuelve los materiales de varias solicitudes en una sola consulta
    if not ids_solicitud:
        return []

    with engine.connect() as connection:
        resultado = connection.execute(
            text("""
                SELECT
                    d.id_solicitud,
                    d.id_material,
                    m.nombre,
                    m.tipo,
                    d.cantidad_solicitada AS cantidad
                FROM detalle_solicitud d
                JOIN material m ON m.id_material = d.id_material
                WHERE d.id_solicitud IN :ids
                ORDER BY d.id_detalle_solicitud
            """).bindparams(bindparam("ids", expanding=True)),
            {"ids": list(ids_solicitud)}
        )
        return [dict(fila._mapping) for fila in resultado]

def obtener_solicitud_por_id(id_solicitud):
    # Trae la solicitud con el id_usuario del solicitante
    with engine.connect() as connection:
        resultado = connection.execute(
            text("""
                SELECT id_solicitud, estado, id_usuario 
                FROM solicitud 
                WHERE id_solicitud = :id_solicitud
            """),
            {"id_solicitud": id_solicitud}
        )
        fila = resultado.fetchone()
        return dict(fila._mapping) if fila else None

def actualizar_estado_solicitud(id_solicitud, nuevo_estado):
    with engine.begin() as connection:
        connection.execute(
            text("""
                UPDATE solicitud 
                SET estado = :nuevo_estado 
                WHERE id_solicitud = :id_solicitud
            """),
            {"nuevo_estado": nuevo_estado, "id_solicitud": id_solicitud}
        )   
    

# H-04.1 - Agregar materiales al listado de una solicitud
def obtener_ids_materiales_de_solicitud(id_solicitud):
    # Devuelve los ids de los materiales que ya estan en el listado
    with engine.connect() as connection:
        resultado = connection.execute(
            text("""
                SELECT id_material
                FROM detalle_solicitud
                WHERE id_solicitud = :id_solicitud
            """),
            {"id_solicitud": id_solicitud}
        )
        return [fila.id_material for fila in resultado]


def agregar_detalles_solicitud(id_solicitud, materiales):
    # Inserta todos los materiales en una sola transaccion, o se guardan todos o no se guarda ninguno
    with engine.begin() as connection:
        for item in materiales:
            connection.execute(
                text("""
                    INSERT INTO detalle_solicitud (id_solicitud, id_material, cantidad_solicitada)
                    VALUES (:id_solicitud, :id_material, :cantidad)
                """),
                {
                    "id_solicitud": id_solicitud,
                    "id_material": item["id_material"],
                    "cantidad": item["cantidad"]
                }
            )