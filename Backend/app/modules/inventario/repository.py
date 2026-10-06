# Este es el archivo que habla directamente con PostgreSQL.
# Capa de acceso a datos.
# Aquí se realizan las consultas y modificaciones directamente
# sobre las tablas de PostgreSQL relacionadas con inventario.

from sqlalchemy import text

from app.core.database import engine


def actualizar_cantidad_inventario(
    id_bodega,
    id_material,
    cantidad,
    tipo_movimiento
):
   
   # Actualiza la cantidad disponible de un material en una bodega.

   # ENTRADA:
     #   Suma la cantidad recibida al inventario actual.

    #SALIDA:
      #  Resta la cantidad solicitada al inventario actual.

    #Esta función únicamente se encarga de modificar la base de datos.
   # Las validaciones y reglas de negocio se manejan en el service.
   

    with engine.begin() as connection:

        # Primero obtenemos el inventario actual del material
        # en la bodega seleccionada.
        resultado = connection.execute(
            text("""
                SELECT
                    id_inventario,
                    cantidad
                FROM inventario
                WHERE id_bodega = :id_bodega
                  AND id_material = :id_material
            """),
            {
                "id_bodega": id_bodega,
                "id_material": id_material
            }
        )

        inventario = resultado.fetchone()

        # Si no existe un registro de inventario para esa combinación,
        # devolvemos None para que el service pueda manejar el caso.
        if inventario is None:
            return None

        cantidad_actual = inventario.cantidad

        # Si el movimiento es una entrada, aumentamos el inventario.
        if tipo_movimiento == "ENTRADA":
            nueva_cantidad = cantidad_actual + cantidad

        # Si el movimiento es una salida, disminuimos el inventario.
        elif tipo_movimiento == "SALIDA":
            nueva_cantidad = cantidad_actual - cantidad

        # Si se recibe otro tipo de movimiento, no modificamos nada.
        else:
            return None

        # Actualizamos la cantidad y la fecha de modificación.
        connection.execute(
            text("""
                UPDATE inventario
                SET
                    cantidad = :nueva_cantidad,
                    fecha_ultima_actualizacion = CURRENT_TIMESTAMP
                WHERE id_inventario = :id_inventario
            """),
            {
                "nueva_cantidad": nueva_cantidad,
                "id_inventario": inventario.id_inventario
            }
        )

        # Devolvemos la nueva cantidad para que las capas superiores
        # puedan utilizarla.
        return nueva_cantidad

# aca es de H-06 con la consulta al inventario

def obtenerInventarioBodega(id_bodega: int):
    #se devuelven todos los materiales de la bodega
    with engine.connect() as connection:
        resultado = connection.execute( # se establece la conexion y se traen estos datos
            text("""
                SELECT
                    i .cantidad,
                    i.stock_minimo,
                    m.id_material,
                    m.codigo,
                    m.nombre,
                    m.tipo,
                    m.unidad_medida,
                    b.id_bodega,
                    b.nombre AS bodega
                FROM inventario i
                JOIN material m ON m.id_material = i.id_material
                JOIN bodega b ON b.id_bodega = i.id_bodega
                WHERE i.id_bodega = :id_bodega
                ORDER BY m.nombre 
            """),
            {"id_bodega": id_bodega}    
        )
        return[dict(fila._mapping) for fila in resultado]

def obtenerBodega(id_bodega: int):
    # se devuelven los datos de una bodega
    with engine.connect() as connection:
        #se obtienen datos de la bodega seleccionada
        resultado = connection.execute(
            text("""
                SELECT
                    id_bodega,
                    nombre,
                    codigo,
                    ubicacion,
                    tipo
                FROM bodega
                WHERE id_bodega = :id_bodega
            """),
            {"id_bodega": id_bodega} 
        )
        fila = resultado.fetchone()
        return dict(fila._mapping) if fila else None    