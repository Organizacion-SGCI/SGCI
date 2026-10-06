-- ============================================================
-- SGCI - Estructura de la base de datos
-- Sistema de Gestión y Control de Inventario
-- ============================================================


-- ============================================================
-- 1. ROLES
-- ============================================================

CREATE TABLE rol (
    id_rol INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);


-- ============================================================
-- 2. PROYECTOS
-- ============================================================

CREATE TABLE proyecto (
    id_proyecto INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    ubicacion VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT chk_proyecto_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO', 'FINALIZADO'))
);


-- ============================================================
-- 3. USUARIOS
-- ============================================================

CREATE TABLE usuario (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    id_rol INTEGER NOT NULL,

    CONSTRAINT chk_usuario_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES rol(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 4. BODEGAS
-- ============================================================

CREATE TABLE bodega (
    id_bodega INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    ubicacion VARCHAR(150),
    tipo VARCHAR(20) NOT NULL,
    capacidad_maxima DECIMAL(12,2),
    id_responsable INTEGER NOT NULL,

    CONSTRAINT chk_bodega_tipo
        CHECK (tipo IN ('CENTRAL', 'SATELITE')),

    CONSTRAINT fk_bodega_responsable
        FOREIGN KEY (id_responsable)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 5. USUARIOS - BODEGAS
-- ============================================================

CREATE TABLE usuario_bodega (
    id_usuario INTEGER NOT NULL,
    id_bodega INTEGER NOT NULL,

    PRIMARY KEY (id_usuario, id_bodega),

    CONSTRAINT fk_usuario_bodega_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_usuario_bodega_bodega
        FOREIGN KEY (id_bodega)
        REFERENCES bodega(id_bodega)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 6. USUARIOS - PROYECTOS
-- ============================================================

CREATE TABLE usuario_proyecto (
    id_usuario INTEGER NOT NULL,
    id_proyecto INTEGER NOT NULL,

    PRIMARY KEY (id_usuario, id_proyecto),

    CONSTRAINT fk_usuario_proyecto_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_usuario_proyecto_proyecto
        FOREIGN KEY (id_proyecto)
        REFERENCES proyecto(id_proyecto)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 7. MATERIALES
-- ============================================================

CREATE TABLE material (
    id_material INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(100),
    unidad_medida VARCHAR(50) NOT NULL
);


-- ============================================================
-- 8. INVENTARIO
-- ============================================================

CREATE TABLE inventario (
    id_inventario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_bodega INTEGER NOT NULL,
    id_material INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,

    fecha_ultima_actualizacion TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_inventario_bodega_material
        UNIQUE (id_bodega, id_material),

    CONSTRAINT fk_inventario_bodega
        FOREIGN KEY (id_bodega)
        REFERENCES bodega(id_bodega)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_inventario_material
        FOREIGN KEY (id_material)
        REFERENCES material(id_material)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_inventario_cantidad
        CHECK (cantidad >= 0),

    CONSTRAINT chk_inventario_stock_minimo
        CHECK (stock_minimo >= 0)
);


-- ============================================================
-- 9. PROVEEDORES
-- ============================================================

CREATE TABLE proveedor (
    id_proveedor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    direccion VARCHAR(200)
);


-- ============================================================
-- 10. ÓRDENES DE COMPRA
-- ============================================================

CREATE TABLE orden_compra (
    id_orden INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    costo_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    id_proveedor INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    id_bodega INTEGER NOT NULL,

    CONSTRAINT chk_orden_estado
        CHECK (estado IN ('PENDIENTE','RECIBIDA','CANCELADA')),

    CONSTRAINT fk_orden_proveedor
        FOREIGN KEY (id_proveedor)
        REFERENCES proveedor(id_proveedor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_orden_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_orden_bodega
        FOREIGN KEY (id_bodega)
        REFERENCES bodega(id_bodega)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 11. DETALLE DE ÓRDENES
-- ============================================================

CREATE TABLE detalle_orden (
    id_detalle_orden INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_orden INTEGER NOT NULL,
    id_material INTEGER NOT NULL,
    cantidad_solicitada INTEGER NOT NULL,
    cantidad_recibida INTEGER NOT NULL DEFAULT 0,
    precio_unitario DECIMAL(12,2),

    CONSTRAINT fk_detalle_orden
        FOREIGN KEY (id_orden)
        REFERENCES orden_compra(id_orden)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_material
        FOREIGN KEY (id_material)
        REFERENCES material(id_material)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_cantidad_solicitada
        CHECK (cantidad_solicitada > 0),

    CONSTRAINT chk_cantidad_recibida
        CHECK (cantidad_recibida >= 0)
);


-- ============================================================
-- 12. SOLICITUDES
-- ============================================================

CREATE TABLE solicitud (
    id_solicitud INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    prioridad VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    id_usuario INTEGER NOT NULL,
    id_bodega_origen INTEGER NOT NULL,
    id_bodega_destino INTEGER NOT NULL,

    CONSTRAINT chk_solicitud_estado
        CHECK (
            estado IN (
                'PENDIENTE',
                'APROBADA',
                'RECHAZADA',
                'EN_TRANSITO',
                'COMPLETADA',
                'CANCELADA'
            )
        ),

    CONSTRAINT chk_solicitud_prioridad
        CHECK (
            prioridad IN (
                'BAJA',
                'MEDIA',
                'ALTA',
                'URGENTE'
            )
        ),

    CONSTRAINT fk_solicitud_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_solicitud_origen
        FOREIGN KEY (id_bodega_origen)
        REFERENCES bodega(id_bodega)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_solicitud_destino
        FOREIGN KEY (id_bodega_destino)
        REFERENCES bodega(id_bodega)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 13. DETALLE DE SOLICITUDES
-- ============================================================

CREATE TABLE detalle_solicitud (
    id_detalle_solicitud INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_solicitud INTEGER NOT NULL,
    id_material INTEGER NOT NULL,
    cantidad_solicitada INTEGER NOT NULL,

    CONSTRAINT fk_detalle_solicitud
        FOREIGN KEY (id_solicitud)
        REFERENCES solicitud(id_solicitud)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_solicitud_material
        FOREIGN KEY (id_material)
        REFERENCES material(id_material)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_detalle_solicitud_cantidad
        CHECK (cantidad_solicitada > 0)
);


-- ============================================================
-- 14. PEDIDOS
-- ============================================================

CREATE TABLE pedido (
    id_pedido INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_estimada DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'EN_TRANSITO',
    id_solicitud INTEGER NOT NULL UNIQUE,

    CONSTRAINT chk_pedido_estado
        CHECK (
            estado IN (
                'EN_TRANSITO',
                'ENTREGADO',
                'COMPLETADO'
            )
        ),

    CONSTRAINT fk_pedido_solicitud
        FOREIGN KEY (id_solicitud)
        REFERENCES solicitud(id_solicitud)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 15. MOVIMIENTOS
-- ============================================================

CREATE TABLE movimiento (
    id_movimiento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL,
    id_material INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    id_bodega_origen INTEGER NULL,
    id_bodega_destino INTEGER NULL,
    id_proyecto INTEGER NULL,
    id_solicitud INTEGER NULL,
    id_proyecto INTEGER NULL,
    id_proveedor INTEGER NULL, 
    observacion VARCHAR(255),
    

    CONSTRAINT chk_movimiento_tipo
        CHECK (
            tipo IN (
                'ENTRADA',
                'SALIDA',
                'TRANSFERENCIA'
            )
        ),

    CONSTRAINT chk_movimiento_cantidad
        CHECK (cantidad > 0),

    CONSTRAINT fk_movimiento_material
        FOREIGN KEY (id_material)
        REFERENCES material(id_material)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movimiento_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movimiento_bodega_origen
        FOREIGN KEY (id_bodega_origen)
        REFERENCES bodega(id_bodega)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movimiento_bodega_destino
        FOREIGN KEY (id_bodega_destino)
        REFERENCES bodega(id_bodega)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

        CONSTRAINT fk_movimiento_proyecto
        FOREIGN KEY (id_proyecto)
        REFERENCES proyecto(id_proyecto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movimiento_solicitud
        FOREIGN KEY (id_solicitud)
        REFERENCES solicitud(id_solicitud)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_movimiento_proyecto
        FOREIGN KEY (id_proyecto)
        REFERENCES proyecto(id_proyecto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movimiento_proveedor               
        FOREIGN KEY (id_proveedor)
        REFERENCES proveedor(id_proveedor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 16. NOTIFICACIONES
-- ============================================================

CREATE TABLE notificacion (
    id_notificacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    mensaje VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    id_usuario INTEGER NOT NULL,

    CONSTRAINT chk_notificacion_tipo
        CHECK (
            tipo IN (
                'SOLICITUD',
                'CAMBIO_ESTADO',
                'STOCK_BAJO'
            )
        ),

    CONSTRAINT fk_notificacion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 17. PROYECTOS - BODEGAS
-- ============================================================

CREATE TABLE proyecto_bodega (
    id_proyecto INTEGER NOT NULL,
    id_bodega INTEGER NOT NULL,

    PRIMARY KEY (id_proyecto, id_bodega),

    CONSTRAINT fk_proyecto_bodega_proyecto
        FOREIGN KEY (id_proyecto)
        REFERENCES proyecto(id_proyecto)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_proyecto_bodega_bodega
        FOREIGN KEY (id_bodega)
        REFERENCES bodega(id_bodega)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);