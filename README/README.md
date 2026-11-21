# SGCI — Sistema de Gestión y Control de Inventario

Proyecto final de **Ingeniería de Software II** — Universidad Nacional (UNA).
Desarrollado para **Parque Tempisque** por Andreina Chaves Castillo, Kristy Paola Mena Morales, Sofía Molina Núñez y Eddy Samir Avendaño Membreño.

---

## 1. Propósito del Proyecto

Aplicación web diseñada para **centralizar el control de los materiales de construcción** de Parque Tempisque. Está dirigida al personal que opera su inventario: el **Jefe de Bodega** (bodega central), los **Encargados de las bodegas satélite** y la **Jefa de Construcción** (consulta por proyecto).

Este proyecto busca resolver la necesidad de **conocer qué materiales están disponibles, cuáles se han solicitado, hacia dónde se han trasladado y cuánto se ha utilizado en cada proyecto**, manteniendo la trazabilidad de los movimientos entre la bodega central, las bodegas satélite y los proyectos.

Funcionalidades principales:

- Inicio de sesión con roles y permisos, y selección de un **contexto de trabajo** (bodega o proyecto).
- **Inventario** por bodega, con búsqueda, indicador de stock bajo y totales de entradas y salidas.
- **Entradas** de material y **comprobante de ingreso**.
- **Salidas** de material con **vale de salida**.
- **Solicitudes** de material: crear, agregar materiales al listado, aprobar o rechazar.
- **Transferencias** entre bodegas a partir de solicitudes aprobadas.
- **Notificaciones** para el solicitante.
- **Reportes** de inventario actual con exportación a Excel y PDF.

> El sistema se limita al control físico y administrativo de los materiales; no cubre asuntos económicos propios de un sistema de facturación.

---

## 2. Stack Tecnológico

- **Frontend:** Next.js 16, React 19, JavaScript, HTML5 y CSS3 con Tailwind CSS 4.
- **Backend:** Python con FastAPI, SQLAlchemy (consultas SQL), Psycopg 3, Pydantic y Uvicorn.
- **Seguridad:** autenticación con JWT (python-jose) y contraseñas con bcrypt.
- **Base de datos:** PostgreSQL.
- **Pruebas:** pytest y httpx (backend).
- **Exportación de reportes:** jsPDF y SheetJS (xlsx), en el navegador.
- **Automatización:** GitHub Actions para el flujo de CI/CD.
- **Entorno de ejecución:** Node.js y npm (frontend), Python y pip (backend).

---

## 3. Requisitos Previos

Para la correcta ejecución del entorno de desarrollo se requiere:

- **Node.js:** versión 20.9 o superior (requisito de Next.js 16).
- **npm:** versión 10 o superior.
- **Python:** versión 3.13 o superior.
- **PostgreSQL:** versión 14 o superior.
- **Git.**
- Acceso a internet para la instalación de dependencias.

Para verificar las versiones instaladas:

```bash
node --version
npm --version
python --version
psql --version
```

---

## 4. Instalación y Ejecución

### 4.1 Clonar el repositorio

```bash
git clone https://github.com/Organizacion-SGCI/SGCI.git
cd SGCI
```

### 4.2 Crear la base de datos

Crear una base de datos vacía y cargar el esquema y los datos de prueba:

```bash
psql -U postgres -c "CREATE DATABASE sgci;"
psql -U postgres -d sgci -f database/schema.sql
psql -U postgres -d sgci -f database/data_prueba.sql
```


### 4.3 Backend

1. Entrar a la carpeta y crear el entorno virtual:

```bash
cd Backend
python -m venv venv
```

2. Activarlo (Windows: `venv\Scripts\activate`; Linux o macOS: `source venv/bin/activate`).
3. Instalar dependencias:

```bash
pip install -r requirements.txt
```

4. Crear el archivo `Backend/.env` con la configuración de la base de datos:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sgci
DB_USER=postgres
DB_PASSWORD=su_contraseña
SECRET_KEY=una_clave_larga_y_secreta
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

5. Iniciar el servidor:

```bash
uvicorn app.main:app --reload
```

La API queda en `http://127.0.0.1:8000` y su documentación interactiva (Swagger) en `http://127.0.0.1:8000/docs`.

### 4.4 Frontend

En otra terminal, desde la raíz del proyecto:

```bash
cd frontend
npm install
npm run dev
```

### 4.5 Acceso

Abrir el navegador en `http://localhost:3000` (la dirección que indica la terminal). El backend debe estar en ejecución.

Usuarios de prueba (contraseña de todos: `123456`):

| Correo | Rol | Asignación |
|---|---|---|
| carlos@sgci.com | Jefe de Bodega | Bodega Central |
| ana@sgci.com | Encargado | Subbodega Norte |
| luis@sgci.com | Encargado | Subbodega Sur |
| maria@sgci.com | Jefa de Construcción | Proyectos |

---

## 5. Comandos Útiles

**Frontend** (desde `frontend/`):

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con recarga en caliente (puerto 3000). |
| `npm run build` | Genera la versión optimizada para producción en la carpeta `.next`. |
| `npm run start` | Sirve la versión de producción generada con `npm run build`. |
| `npm run lint` | Revisa el código con ESLint. |

**Backend** (desde `Backend/`, con el entorno virtual activado):

| Comando | Descripción |
|---|---|
| `uvicorn app.main:app --reload` | Inicia la API con recarga automática (puerto 8000). |
| `pytest tests/ -v` | Ejecuta las pruebas del backend. Requieren la base de datos con el esquema y los datos de prueba cargados. |

---

## 6. Estructura del Proyecto

```text
SGCI/
├── Backend/
│   ├── app/
│   │   ├── core/            # Configuración, base de datos, seguridad (JWT) y permisos por rol
│   │   ├── modules/         # Un módulo por funcionalidad (router, service y repository)
│   │   │   ├── login/  contexto/  permisos/  bodega/  proyectos/
│   │   │   ├── inventario/  movimientos/  ingreso/  salida/
│   │   │   └── solicitudes/  transferencias/  notificaciones/  reportes/
│   │   └── main.py          # Aplicación FastAPI y registro de los routers
│   ├── tests/               # Pruebas con pytest
│   └── requirements.txt     # Dependencias de Python
├── database/
│   ├── schema.sql           # Esquema de la base de datos
│   └── data_prueba.sql      # Datos de prueba (roles, usuarios, bodegas, materiales)
├── frontend/
│   ├── public/              # Recursos estáticos (imágenes)
│   └── src/
│       ├── app/             # Pantallas (una carpeta por ruta)
│       ├── components/      # Componentes reutilizables (menú, modales, botones)
│       ├── hooks/           # Hooks de React (permisos)
│       ├── services/        # Comunicación con la API
│       ├── utils/           # Utilidades (exportación de reportes)
│       └── middleware.ts    # Protección de rutas por rol
└── .github/workflows/       # Configuración YAML de GitHub Actions
```

En el backend cada módulo separa sus responsabilidades en tres capas: **router** (endpoints HTTP), **service** (reglas de negocio) y **repository** (acceso a PostgreSQL).

---

## 7. Flujo de CI/CD

El proyecto integra **GitHub Actions** (archivo `.github/workflows/ci.yml`) para asegurar la calidad del código. Ante cada Pull Request o actualización en la rama principal, se ejecutan automáticamente dos trabajos en paralelo.

**Frontend:**

1. Configuración del entorno Node.js.
2. Instalación limpia de dependencias (`npm ci`).
3. Ejecución de ESLint para revisar el código. Los errores de esta validación no detienen el flujo de CI/CD.
4. Compilación del proyecto (`npm run build`).

**Backend:**

1. Configuración del entorno Python y de un servicio PostgreSQL temporal.
2. Instalación de dependencias (`pip install -r requirements.txt`).
3. Creación del esquema y de los datos de prueba en la base temporal.
4. Ejecución de las pruebas (`pytest`).

---

## 8. Decisiones Técnicas y Limitaciones

**Decisiones técnicas**

- **Monolito modular con arquitectura en capas:** el backend se organiza por módulos funcionales, cada uno con router, service y repository.
- **Seguridad:** autenticación con JWT y permisos por rol definidos en el backend. El acceso se valida en el servidor y el frontend solo oculta opciones (menú y botones) según los permisos.
- **Contexto de trabajo:** tras iniciar sesión se elige una bodega o un proyecto, y las pantallas trabajan sobre ese contexto.
- **Operaciones críticas en una sola transacción:** por ejemplo, la transferencia de materiales valida el stock, descuenta el inventario, registra los movimientos y cambia los estados, o no guarda nada.
- **Zona horaria:** la conexión a PostgreSQL usa `America/Costa_Rica` para que las fechas se guarden en hora local.
- **Contratos JSON definidos antes de codificar**, para que frontend y backend avancen en paralelo.
- **Exportación a Excel y PDF en el navegador**, sin pasar por el servidor.

**Limitaciones del alcance actual**

- No existe la gestión (crear, editar y eliminar) de materiales, bodegas, proyectos y usuarios desde la aplicación; estos datos se cargan mediante scripts SQL.
- No se manejan devoluciones ni stock negativo.
- Los totales de entradas y salidas se calculan solo con los movimientos registrados, por lo que no incluyen el stock inicial cargado como dato de prueba.
- La dirección del backend está escrita en los servicios del frontend (`http://127.0.0.1:8000`) y no se configura por variable de entorno.
- Las pruebas automatizadas cubren solo parte del backend (permisos); el frontend no tiene pruebas.
- No se cubren asuntos económicos propios de la facturación.

---

## 9. Próximos Pasos

- Módulos de administración de materiales, bodegas, proyectos y usuarios.
- Pruebas automatizadas del frontend y mayor cobertura de pruebas en el backend.
- Configurar la dirección de la API mediante variables de entorno para poder desplegar la aplicación.
- Fortalecer la seguridad de las operaciones de inventario (autenticación en todos los endpoints y registro de cada cambio).
- Historial de movimientos y trazabilidad por material con exportación.
- Implementación de pruebas visuales automatizadas (Visual Testing).
- Optimización de carga de recursos estáticos.
