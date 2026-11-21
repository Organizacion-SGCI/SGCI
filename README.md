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
- **Contenedores:** Docker y Docker Compose para construir y ejecutar los servicios del sistema.

---

## 3. Requisitos Previos

Para la correcta ejecución del entorno de desarrollo se requiere:

- **Node.js:** versión 20.9 o superior (requisito de Next.js 16).
- **npm:** versión 10 o superior.
- **Python:** versión 3.13 o superior.
- **PostgreSQL:** versión 14 o superior.
- **Git.**
- **Docker Desktop** (opcional): necesario para ejecutar el proyecto mediante Docker Compose.
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

### 4.1. Clonar el repositorio

```bash
git clone https://github.com/Organizacion-SGCI/SGCI.git
cd SGCI
```

### 4.2. Opción A: Ejecución con Docker Compose

Esta opción permite construir y ejecutar el sistema completo mediante contenedores, incluyendo la base de datos PostgreSQL, el backend y el frontend.

**Requisito:** tener Docker Desktop instalado y en ejecución.

1. Desde la carpeta principal del proyecto, ejecutar:

   ```bash
   docker compose up --build
   ```

2. Esperar a que los servicios terminen de iniciar. Docker Compose se encarga de crear la base de datos, cargar el esquema y los datos de prueba durante su primera inicialización, y levantar el backend y el frontend.

**Nota:** Los scripts SQL (schema.sql y data_prueba.sql) se ejecutan automáticamente únicamente cuando se crea e inicializa el volumen de PostgreSQL por primera vez. Si el volumen ya existe, Docker no vuelve a ejecutar estos archivos.

3. Acceder al sistema desde las siguientes direcciones:

   - **Frontend:** http://localhost:3000
   - **Backend:** http://localhost:8000
   - **Documentación de la API:** http://localhost:8000/docs

Para detener los servicios:

```bash
docker compose down
```

**Nota:** los datos de la base de datos se conservan al detener y volver a iniciar los contenedores. Para eliminar también los datos almacenados y crear la base de datos desde cero, se puede ejecutar:

```bash
docker compose down -v
```

Este último comando elimina el volumen de PostgreSQL y, por tanto, los datos almacenados.

### 4.3. Opción B: Instalación manual

Esta modalidad permite instalar y ejecutar cada componente por separado.

#### 4.3.1. Crear la base de datos

Crear una base de datos vacía y cargar el esquema y los datos de prueba:

```bash
psql -U postgres -c "CREATE DATABASE sgci;"
psql -U postgres -d sgci -f database/schema.sql
psql -U postgres -d sgci -f database/data_prueba.sql
```


#### 4.3.2. Backend

1. Entrar a la carpeta y crear el entorno virtual:

   ```bash
   cd Backend
   python -m venv venv
   ```

2. Activarlo (Windows: `venv\Scripts\activate`; Linux o macOS: `source venv/bin/activate`).

3. Instalar las dependencias:

   ```bash
   pip install -r requirements.txt
   ```

4. Crear el archivo .env dentro de la carpeta Backend, con la configuración de la base de datos:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=sgci
   DB_USER=postgres
   DB_PASSWORD=su_contraseña
   SECRET_KEY=una_clave_larga_y_secreta
   ACCESS_TOKEN_EXPIRE_MINUTES=480
   ```

5. Iniciar el backend:

   ```bash
   uvicorn app.main:app --reload
   ```

#### 4.3.3. Frontend

1. Abrir otra terminal y entrar a la carpeta del frontend:

   ```bash
   cd frontend
   ```

2. Instalar las dependencias:

   ```bash
   npm install
   ```

3. Iniciar el frontend:

   ```bash
   npm run dev
   ```

4. Acceder al sistema desde:

   http://localhost:3000

### 4.4. Usuarios de prueba

Para probar el sistema se pueden utilizar las siguientes cuentas:

- **Carlos:** carlos@sgci.com
- **Ana:** ana@sgci.com
- **Luis:** luis@sgci.com
- **María:** maria@sgci.com

**Contraseña para las cuentas de prueba:** `123456`


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


**Docker Compose**

| Comando | Descripción |
|---|---|
| `docker compose up --build` | Construye las imágenes y levanta todos los servicios. |
| `docker compose up -d` | Levanta los servicios en segundo plano. |
| `docker compose down` | Detiene y elimina los contenedores. |
| `docker compose down -v` | Detiene los servicios y elimina también los volúmenes. **Puede borrar los datos de la base de datos local.** |
| `docker compose logs backend` | Muestra los registros del backend. |
| `docker compose logs -f` | Permite observar los registros de los servicios en tiempo real. |

---

## 6. Estructura del Proyecto

```text
SGCI/
├── Backend/
│   ├── app/
│   │   ├── core/                 # Configuración, base de datos, seguridad (JWT) y permisos por rol
│   │   ├── modules/              # Un módulo por funcionalidad (router, service y repository)
│   │   │   ├── login/ contexto/ permisos/ bodega/ proyectos/
│   │   │   ├── inventario/ movimientos/ ingreso/ salida/
│   │   │   └── solicitudes/ transferencias/ notificaciones/ reportes/
│   │   └── main.py               # Aplicación FastAPI y registro de los routers
│   ├── tests/                    # Pruebas con pytest
│   ├── requirements.txt          # Dependencias de Python
│   └── Dockerfile
├── database/
│   ├── schema.sql                # Esquema de la base de datos
│   └── data_prueba.sql           # Datos de prueba
├── frontend/
│   ├── public/                   # Recursos estáticos (imágenes)
│   ├── src/
│   │   ├── app/                  # Pantallas (una carpeta por ruta)
│   │   ├── components/           # Componentes reutilizables
│   │   ├── hooks/                # Hooks de React
│   │   ├── services/             # Comunicación con la API
│   │   ├── utils/                # Utilidades
│   │   └── middleware.ts         # Protección de rutas por rol
│   └── Dockerfile
├── .github/
│   └── workflows/                # Configuración YAML de GitHub Actions
└── docker-compose.yml
```

En el backend cada módulo separa sus responsabilidades en tres capas: **router** (endpoints HTTP), **service** (reglas de negocio) y **repository** (acceso a PostgreSQL).

---

## 7. Integración y despliegue continuo (CI/CD)

El proyecto utiliza **GitHub Actions** para automatizar la validación del código y comprobar que los componentes principales funcionen correctamente.

El flujo se ejecuta automáticamente en los siguientes casos:
- Cuando se crea o actualiza un Pull Request.
- Cuando se realiza un `push` a la rama `main`.

### Trabajos del flujo CI

El archivo de configuración se encuentra en `.github/workflows/ci.yml` y contiene los siguientes trabajos:

1. **Frontend (Next.js):**
   - Instala las dependencias mediante `npm ci`.
   - Ejecuta ESLint para revisar el código; los errores de esta validación no detienen el flujo de CI.
   - Compila el proyecto con `npm run build`.

2. **Backend (FastAPI + PostgreSQL):**
   - Inicia una instancia temporal de PostgreSQL 16.
   - Crea el esquema de la base de datos y carga los datos de prueba.
   - Instala las dependencias del backend.
   - Ejecuta las pruebas automatizadas con `pytest`.

3. **Contenedores (Docker Compose):**
   - Construye las imágenes de Docker.
   - Inicia los servicios del sistema.
   - Comprueba que el backend y el frontend respondan.
   - Realiza una prueba de inicio de sesión con un usuario de prueba.
   - Detiene y limpia los contenedores al finalizar.

### Despliegue continuo (CD)

Cuando los trabajos de validación finalizan correctamente y se actualiza la rama `main`, GitHub Actions activa el despliegue del backend en **Render** mediante un Deploy Hook configurado como secreto del repositorio (`RENDER_DEPLOY_HOOK_URL`).

El frontend se despliega en **Vercel** mediante su integración con GitHub, que permite actualizar la aplicación cuando se incorporan cambios a la rama configurada.

De esta manera, el proyecto automatiza las comprobaciones principales y facilita la publicación de nuevas versiones.

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
- **Configuración de API:** la conexión entre el frontend y el backend se establece mediante la variable de entorno `NEXT_PUBLIC_API_URL`, permitiendo utilizar diferentes direcciones según el entorno de ejecución.

**Limitaciones del alcance actual**

- No existe la gestión (crear, editar y eliminar) de materiales, bodegas, proyectos y usuarios desde la aplicación; estos datos se cargan mediante scripts SQL.
- No se manejan devoluciones ni stock negativo.
- Los totales de entradas y salidas se calculan solo con los movimientos registrados, por lo que no incluyen el stock inicial cargado como dato de prueba.
- Las pruebas automatizadas cubren solo parte del backend (permisos); el frontend no tiene pruebas.
- No se cubren asuntos económicos propios de la facturación.

---

## 9. Próximos Pasos

- Módulos de administración de materiales, bodegas, proyectos y usuarios.
- Pruebas automatizadas del frontend y mayor cobertura de pruebas en el backend.
- Fortalecer la seguridad de las operaciones de inventario (autenticación en todos los endpoints y registro de cada cambio).
- Historial de movimientos y trazabilidad por material con exportación.
- Implementación de pruebas visuales automatizadas (Visual Testing).
- Optimización de carga de recursos estáticos.
