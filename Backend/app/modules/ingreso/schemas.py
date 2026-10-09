from datetime import datetime

from pydantic import BaseModel


class ProveedorIngreso(BaseModel):
    id_proveedor: int
    nombre: str


class ResponsableIngreso(BaseModel):
    id_usuario: int
    nombre: str


class MaterialIngreso(BaseModel):
    id_material: int
    codigo: str
    nombre: str
    unidad_medida: str
    cantidad: int


class ComprobanteIngreso(BaseModel):
    id_movimiento: int
    fecha_movimiento: datetime
    proveedor: ProveedorIngreso
    responsable: ResponsableIngreso
    materiales: list[MaterialIngreso]