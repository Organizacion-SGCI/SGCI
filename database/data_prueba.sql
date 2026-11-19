-- ============================================================
-- SGCI - Datos de prueba
-- Sistema de Gestión y Control de Inventario
-- ============================================================


-- ============================================================
-- 1. ROLES
-- ============================================================

INSERT INTO rol (nombre, descripcion)
VALUES
    ('Jefe de Bodega', 'Administra la bodega central y supervisa las operaciones.'),
    ('Encargado', 'Gestiona las operaciones de una bodega asignada.'),
    ('Jefa de Construcción', 'Consulta y gestiona información relacionada con proyectos.');


-- ============================================================
-- 2. PROYECTOS
-- ============================================================

INSERT INTO proyecto (nombre, ubicacion, estado)
VALUES
    ('Proyecto Residencial A', 'Liberia, Guanacaste', 'ACTIVO'),
    ('Proyecto Comercial B', 'Nicoya, Guanacaste', 'ACTIVO'),
    ('Proyecto Habitacional C', 'Santa Cruz, Guanacaste', 'ACTIVO');


-- ============================================================
-- 3. USUARIOS
-- ============================================================

INSERT INTO usuario (
    nombre,
    correo,
    password,
    telefono,
    estado,
    id_rol
)
VALUES
    (
        'Carlos Administrador',
        'carlos@sgci.com',
        '$2b$12$hUnc.pIHQwKZEc98a37Hj.2TGT.cFt900KCX3TfHLDeYSW.mnxIPG',
        '8888-1111',
        'ACTIVO',
        (SELECT id_rol FROM rol WHERE nombre = 'Jefe de Bodega')
    ),
    (
        'Ana Encargada',
        'ana@sgci.com',
        '$2b$12$jW43YsWlxhdm..lLPMY4g.k0Fs6rafyk6./SLX7i4yTANGEGHnKe2',
        '8888-2222',
        'ACTIVO',
        (SELECT id_rol FROM rol WHERE nombre = 'Encargado')
    ),
    (
        'Luis Encargado',
        'luis@sgci.com',
        '$2b$12$7U5g8Jz/a.ZepPeQK82OOO4eX6e0DmeIzcI4NKGwHvnrmshqnp4TW',
        '8888-3333',
        'ACTIVO',
        (SELECT id_rol FROM rol WHERE nombre = 'Encargado')
    ),
    (
        'María Construcción',
        'maria@sgci.com',
        '$2b$12$t.UKaoFYtp.e4zzl2Tah6Os59XosjEZQL7Yqg5bv.4Rq9toqHccae',
        '8888-4444',
        'ACTIVO',
        (SELECT id_rol FROM rol WHERE nombre = 'Jefa de Construcción')
    );


-- ============================================================
-- 4. BODEGAS
-- ============================================================

INSERT INTO bodega (
    nombre,
    codigo,
    ubicacion,
    tipo,
    capacidad_maxima,
    id_responsable
)
VALUES
    (
        'Bodega Central',
        'BC-001',
        'Liberia, Guanacaste',
        'CENTRAL',
        10000,
        (
            SELECT id_usuario
            FROM usuario
            WHERE correo = 'carlos@sgci.com'
        )
    ),
    (
        'Subbodega Norte',
        'SB-001',
        'Liberia, Guanacaste',
        'SATELITE',
        5000,
        (
            SELECT id_usuario
            FROM usuario
            WHERE correo = 'ana@sgci.com'
        )
    ),
    (
        'Subbodega Sur',
        'SB-002',
        'Santa Cruz, Guanacaste',
        'SATELITE',
        5000,
        (
            SELECT id_usuario
            FROM usuario
            WHERE correo = 'luis@sgci.com'
        )
    );


-- ============================================================
-- 5. USUARIOS - BODEGAS
-- ============================================================

INSERT INTO usuario_bodega (id_usuario, id_bodega)
VALUES
    (
        (
            SELECT id_usuario
            FROM usuario
            WHERE correo = 'carlos@sgci.com'
        ),
        (
            SELECT id_bodega
            FROM bodega
            WHERE codigo = 'BC-001'
        )
    ),
    (
        (
            SELECT id_usuario
            FROM usuario
            WHERE correo = 'ana@sgci.com'
        ),
        (
            SELECT id_bodega
            FROM bodega
            WHERE codigo = 'SB-001'
        )
    ),
    (
        (
            SELECT id_usuario
            FROM usuario
            WHERE correo = 'luis@sgci.com'
        ),
        (
            SELECT id_bodega
            FROM bodega
            WHERE codigo = 'SB-002'
        )
    );


-- ============================================================
-- 6. USUARIOS - PROYECTOS
-- ============================================================

INSERT INTO usuario_proyecto (id_usuario, id_proyecto)
VALUES
    (
        (
            SELECT id_usuario
            FROM usuario
            WHERE correo = 'maria@sgci.com'
        ),
        (
            SELECT id_proyecto
            FROM proyecto
            WHERE nombre = 'Proyecto Residencial A'
        )
    ),
    (
        (
            SELECT id_usuario
            FROM usuario
            WHERE correo = 'maria@sgci.com'
        ),
        (
            SELECT id_proyecto
            FROM proyecto
            WHERE nombre = 'Proyecto Comercial B'
        )
    ),
    (
        (
            SELECT id_usuario
            FROM usuario
            WHERE correo = 'maria@sgci.com'
        ),
        (
            SELECT id_proyecto
            FROM proyecto
            WHERE nombre = 'Proyecto Habitacional C'
        )
    );


-- ============================================================
-- 7. MATERIALES
-- ============================================================

INSERT INTO material (
    codigo,
    nombre,
    tipo,
    unidad_medida
)
VALUES
    ('MAT-001', 'Cemento', 'Construcción', 'Saco'),
    ('MAT-002', 'Arena', 'Construcción', 'Metro cúbico'),
    ('MAT-003', 'Bloques', 'Construcción', 'Unidad'),
    ('MAT-004', 'Varilla', 'Construcción', 'Unidad'),
    ('MAT-005', 'Piedra', 'Construcción', 'Metro cúbico');


-- ============================================================
-- 8. INVENTARIO
-- ============================================================

INSERT INTO inventario (
    id_bodega,
    id_material,
    cantidad,
    stock_minimo
)
VALUES

    -- Bodega Central
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'BC-001'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-001'),
        500,
        100
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'BC-001'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-002'),
        300,
        50
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'BC-001'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-003'),
        1000,
        200
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'BC-001'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-004'),
        800,
        150
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'BC-001'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-005'),
        250,
        50
    ),

    -- Subbodega Norte
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'SB-001'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-001'),
        80,
        100
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'SB-001'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-002'),
        120,
        50
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'SB-001'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-003'),
        300,
        100
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'SB-001'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-004'),
        90,
        100
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'SB-001'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-005'),
        70,
        30
    ),

    -- Subbodega Sur
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'SB-002'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-001'),
        150,
        100
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'SB-002'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-002'),
        40,
        50
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'SB-002'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-003'),
        250,
        100
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'SB-002'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-004'),
        130,
        100
    ),
    (
        (SELECT id_bodega FROM bodega WHERE codigo = 'SB-002'),
        (SELECT id_material FROM material WHERE codigo = 'MAT-005'),
        20,
        30
    );


-- ============================================================
-- 9. PROYECTOS - BODEGAS
-- ============================================================

-- La Bodega Central puede atender los tres proyectos.
INSERT INTO proyecto_bodega (id_proyecto, id_bodega)
SELECT p.id_proyecto, b.id_bodega
FROM proyecto p
CROSS JOIN bodega b
WHERE b.codigo = 'BC-001';


-- La Subbodega Norte atiende los proyectos A y C.
INSERT INTO proyecto_bodega (id_proyecto, id_bodega)
SELECT p.id_proyecto, b.id_bodega
FROM proyecto p
CROSS JOIN bodega b
WHERE b.codigo = 'SB-001'
AND p.nombre IN (
    'Proyecto Residencial A',
    'Proyecto Habitacional C'
);


-- La Subbodega Sur atiende los proyectos B y C.
INSERT INTO proyecto_bodega (id_proyecto, id_bodega)
SELECT p.id_proyecto, b.id_bodega
FROM proyecto p
CROSS JOIN bodega b
WHERE b.codigo = 'SB-002'
AND p.nombre IN (
    'Proyecto Comercial B',
    'Proyecto Habitacional C'
);




-- ============================================================
-- 10. PROVEEDORES
-- ============================================================

INSERT INTO proveedor (nombre, contacto, telefono, direccion)
VALUES
    ('Cemex Costa Rica', 'Servicio al cliente', '2222-1111', 'San José'),
    ('Ferretería El Colono', 'Ventas', '2666-2222', 'Liberia, Guanacaste');