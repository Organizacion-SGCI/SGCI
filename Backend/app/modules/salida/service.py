# Capa de lógica del módulo de salida.
# Aplicará reglas de negocio y llamará a T-04 para actualizar inventario.

from app.modules.salida.repository import (
    obtener_material,
    obtener_proyecto,
    obtener_usuario,
    registrar_movimiento_salida
)
from app.modules.inventario.service import actualizar_inventario


def registrar_salida(
    id_usuario,
    id_material,
    cantidad,
    id_bodega_origen,
    id_proyecto,
    observacion=None
):
    """
    Registra la salida de un material y genera el vale correspondiente.

    Flujo:
    1. Validar que el material existe (RN-06).
    2. Validar que el proyecto existe.
    3. Validar que el usuario responsable existe.
    4. Actualizar el inventario (valida stock disponible - RN-04).
    5. Registrar el movimiento en la tabla movimiento (RN-14).
    6. Generar el número único de vale.

    Si alguna validación falla, se lanza ValueError y el router
    lo convierte en una respuesta HTTP 400.
    """

    # 1-Validar que el material existe (RN-06)
    material = obtener_material(id_material)
    if material is None:
        raise ValueError("El material no existe en el sistema")

    # 2-Validar que el proyecto existe
    proyecto = obtener_proyecto(id_proyecto)
    if proyecto is None:
        raise ValueError("El proyecto no existe en el sistema")

    # 3-Validar que el usuario responsable existe
    usuario = obtener_usuario(id_usuario)
    if usuario is None:
        raise ValueError("El usuario no existe en el sistema")

    # 4-Actualizar el inventario (valida stock disponible - RN-04)
    # Si no hay stock suficiente, esta función lanza ValueError.
    resultado_inventario = actualizar_inventario(
        id_bodega=id_bodega_origen,
        id_material=id_material,
        cantidad=cantidad,
        tipo_movimiento="SALIDA"
    )

    # 5-Registrar el movimiento en la tabla movimiento
    movimiento = registrar_movimiento_salida(
        id_material=id_material,
        cantidad=cantidad,
        id_usuario=id_usuario,
        id_bodega_origen=id_bodega_origen,
        id_proyecto=id_proyecto,
        observacion=observacion
    )

    # 6-Generar el número único de vale (formato VALE-{año}-{id})
    anio = movimiento["fecha_movimiento"].year
    numero_vale = f"VALE-{anio}-{movimiento['id_movimiento']:03d}"

    return {
        "id_movimiento": movimiento["id_movimiento"],
        "numero_vale": numero_vale,
        "fecha_movimiento": movimiento["fecha_movimiento"],
        "material": material["nombre"],
        "codigo_material": material["codigo"],
        "unidad_medida": material["unidad_medida"],
        "cantidad": cantidad,
        "id_bodega_origen": id_bodega_origen,
        "proyecto": proyecto["nombre"],
        "responsable": usuario["nombre"],
        "cantidad_actual": resultado_inventario["cantidad_actual"],
        "observacion": observacion
    }