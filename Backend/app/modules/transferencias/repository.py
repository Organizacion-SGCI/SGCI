# Capa de acceso a datos - transferencias.
# H-10.2: confirma la transferencia de una solicitud aprobada.
#
# Todo se hace en UNA sola transaccion: si cualquier paso falla,
# no se guarda nada (ni inventario, ni movimientos, ni estados).

from sqlalchemy import text

from app.core.database import engine


class SolicitudNoEncontrada(Exception):
    # La solicitud indicada no existe
    pass


class SinPermisoTransferencia(Exception):
    # El usuario no pertenece a la bodega que surte la solicitud
    pass


class TransferenciaInvalida(ValueError):
    # La transferencia no se puede realizar (estado, stock, etc.)
    pass


def ejecutar_transferencia(id_solicitud, id_usuario):
    """
    Transfiere los materiales de una solicitud APROBADA:

    1. Valida la solicitud, el permiso del usuario y el stock disponible.
    2. Descuenta el inventario de la bodega de salida (la que surte).
    3. Registra un movimiento TRANSFERENCIA por cada material.
    4. Crea el pedido en estado EN_TRANSITO.
    5. Pasa la solicitud a EN_TRANSITO.

    En el modelo actual: bodega_origen de la solicitud = satelite que pide y
    bodega_destino de la solicitud = central que surte. El movimiento fisico
    va en sentido contrario: central -> satelite.
    """

    with engine.begin() as connection:

        # 1. Bloqueamos la solicitud para que dos personas no la
        #    transfieran al mismo tiempo.
        solicitud = connection.execute(
            text("""
                SELECT
                    s.id_solicitud,
                    s.estado,
                    s.id_usuario,
                    s.id_bodega_origen,
                    s.id_bodega_destino,
                    bs.nombre AS bodega_salida,
                    br.nombre AS bodega_recepcion
                FROM solicitud s
                JOIN bodega bs ON bs.id_bodega = s.id_bodega_destino
                JOIN bodega br ON br.id_bodega = s.id_bodega_origen
                WHERE s.id_solicitud = :id_solicitud
                FOR UPDATE OF s
            """),
            {"id_solicitud": id_solicitud}
        ).fetchone()

        if solicitud is None:
            raise SolicitudNoEncontrada("La solicitud no existe.")

        id_bodega_salida = solicitud.id_bodega_destino
        id_bodega_recepcion = solicitud.id_bodega_origen

        # 2. El usuario debe pertenecer a la bodega que surte la solicitud.
        pertenece = connection.execute(
            text("""
                SELECT 1
                FROM usuario_bodega
                WHERE id_usuario = :id_usuario
                  AND id_bodega = :id_bodega
            """),
            {"id_usuario": id_usuario, "id_bodega": id_bodega_salida}
        ).fetchone()

        if pertenece is None:
            raise SinPermisoTransferencia(
                "Solo el Jefe de la bodega que surte la solicitud puede transferirla."
            )

        # 3. Solo se transfieren solicitudes aprobadas
        #    (una ya transferida queda EN_TRANSITO y no pasa de aqui).
        if solicitud.estado != "APROBADA":
            raise TransferenciaInvalida(
                "Solo se pueden transferir solicitudes aprobadas."
            )

        # 4. Materiales y cantidades de la solicitud
        materiales = connection.execute(
            text("""
                SELECT
                    d.id_material,
                    m.nombre,
                    d.cantidad_solicitada AS cantidad
                FROM detalle_solicitud d
                JOIN material m ON m.id_material = d.id_material
                WHERE d.id_solicitud = :id_solicitud
                ORDER BY d.id_detalle_solicitud
            """),
            {"id_solicitud": id_solicitud}
        ).fetchall()

        if not materiales:
            raise TransferenciaInvalida("La solicitud no tiene materiales.")

        # 5. Revisamos el stock de TODOS los materiales antes de modificar
        #    nada, para poder avisar de todos los faltantes juntos.
        inventarios = {}
        faltantes = []

        for material in materiales:
            inventario = connection.execute(
                text("""
                    SELECT id_inventario, cantidad
                    FROM inventario
                    WHERE id_bodega = :id_bodega
                      AND id_material = :id_material
                    FOR UPDATE
                """),
                {
                    "id_bodega": id_bodega_salida,
                    "id_material": material.id_material
                }
            ).fetchone()

            disponible = inventario.cantidad if inventario else 0

            if inventario is None or disponible < material.cantidad:
                faltantes.append(
                    f"{material.nombre} (disponible {disponible}, "
                    f"solicitado {material.cantidad})"
                )
            else:
                inventarios[material.id_material] = inventario

        if faltantes:
            raise TransferenciaInvalida(
                "Stock insuficiente en la bodega de salida: "
                + "; ".join(faltantes) + "."
            )

        # 6. Descontamos el inventario de la bodega de salida
        #    y registramos el movimiento de cada material.
        detalle = []

        for material in materiales:
            actualizado = connection.execute(
                text("""
                    UPDATE inventario
                    SET
                        cantidad = cantidad - :cantidad,
                        fecha_ultima_actualizacion = CURRENT_TIMESTAMP
                    WHERE id_inventario = :id_inventario
                    RETURNING cantidad
                """),
                {
                    "cantidad": material.cantidad,
                    "id_inventario": inventarios[material.id_material].id_inventario
                }
            ).fetchone()

            connection.execute(
                text("""
                    INSERT INTO movimiento (
                        tipo,
                        cantidad,
                        id_material,
                        id_usuario,
                        id_bodega_origen,
                        id_bodega_destino,
                        id_solicitud
                    )
                    VALUES (
                        'TRANSFERENCIA',
                        :cantidad,
                        :id_material,
                        :id_usuario,
                        :id_bodega_origen,
                        :id_bodega_destino,
                        :id_solicitud
                    )
                """),
                {
                    "cantidad": material.cantidad,
                    "id_material": material.id_material,
                    "id_usuario": id_usuario,
                    "id_bodega_origen": id_bodega_salida,
                    "id_bodega_destino": id_bodega_recepcion,
                    "id_solicitud": id_solicitud
                }
            )

            detalle.append({
                "id_material": material.id_material,
                "nombre": material.nombre,
                "cantidad": material.cantidad,
                "stock_salida_actual": actualizado.cantidad
            })

        # 7. Creamos el pedido y marcamos la solicitud como EN_TRANSITO
        pedido = connection.execute(
            text("""
                INSERT INTO pedido (id_solicitud, estado)
                VALUES (:id_solicitud, 'EN_TRANSITO')
                RETURNING id_pedido, fecha_pedido
            """),
            {"id_solicitud": id_solicitud}
        ).fetchone()

        connection.execute(
            text("""
                UPDATE solicitud
                SET estado = 'EN_TRANSITO'
                WHERE id_solicitud = :id_solicitud
            """),
            {"id_solicitud": id_solicitud}
        )

        return {
            "id_pedido": pedido.id_pedido,
            "fecha_pedido": pedido.fecha_pedido,
            "id_solicitud": id_solicitud,
            "bodega_salida": solicitud.bodega_salida,
            "bodega_recepcion": solicitud.bodega_recepcion,
            "materiales": detalle
        }