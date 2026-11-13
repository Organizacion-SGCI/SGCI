# Capa API - endpoints de reportes
# H-15.1: GET /reportes/inventario devuelve el reporte de inventario actual
# Solo Jefe de Bodega y Jefa de Construccion (segun H-15)

from fastapi import APIRouter, HTTPException, Depends, Query

from app.core.dependencies import require_rol
from app.modules.reportes.service import (
    generar_reporte_inventario,
    SinAccesoContexto
)


router = APIRouter(
    prefix="/reportes",
    tags=["Reportes"]
)


@router.get("/inventario")
def reporte_inventario_endpoint(
    id_bodega: int | None = Query(default=None, gt=0),
    id_proyecto: int | None = Query(default=None, gt=0),
    material: str | None = None,
    estado: str | None = None,
    usuario_actual: dict = Depends(
        require_rol(["Jefe de Bodega", "Jefa de Construcción"])
    )
):
    # H-15.1: reporte del inventario actual de una bodega o de un proyecto
    try:
        return generar_reporte_inventario(
            id_usuario=usuario_actual["id_usuario"],
            id_bodega=id_bodega,
            id_proyecto=id_proyecto,
            material=material,
            estado=estado
        )
    except SinAccesoContexto as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))