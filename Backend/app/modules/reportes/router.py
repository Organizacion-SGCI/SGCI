from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import require_rol
from app.modules.reportes.service import (
    SinAccesoContexto,
    generar_reporte_inventario,
    generar_reporte_movimientos,
)


router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.get("/inventario")
def reporte_inventario_endpoint(
    id_bodega: int | None = Query(default=None, gt=0),
    id_proyecto: int | None = Query(default=None, gt=0),
    material: str | None = None,
    estado: str | None = None,
    usuario_actual: dict = Depends(
        require_rol(["Jefe de Bodega", "Jefa de Construcción"])
    ),
):
    try:
        return generar_reporte_inventario(
            id_usuario=usuario_actual["id_usuario"],
            id_bodega=id_bodega,
            id_proyecto=id_proyecto,
            material=material,
            estado=estado,
        )
    except SinAccesoContexto as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/movimientos")
def reporte_movimientos_endpoint(
    id_bodega: int | None = Query(default=None, gt=0),
    id_proyecto: int | None = Query(default=None, gt=0),
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    tipo: Literal["ENTRADA", "SALIDA", "TRANSFERENCIA"] | None = None,
    material: str | None = None,
    usuario_actual: dict = Depends(
        require_rol(["Jefe de Bodega", "Jefa de Construcción"])
    ),
):
    try:
        return generar_reporte_movimientos(
            id_usuario=usuario_actual["id_usuario"],
            id_bodega=id_bodega,
            id_proyecto=id_proyecto,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            tipo=tipo,
            material=material,
        )
    except SinAccesoContexto as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e