# BillZen — Portal de Usuarios y Distribución

> Sistema contable y de facturación electrónica para MiPyMEs colombianas.

Este repositorio (`bill_zen_users`) aloja la **plataforma web pública, el módulo de autenticación/registro de empresas y el portal de descarga** del software de escritorio **BillZen ERP**, desplegado bajo una arquitectura **Serverless Full-Stack** en **Vercel** con base de datos **PostgreSQL Serverless en Neon.tech**.

---

## Tabla de contenidos

1. [Arquitectura del Sistema](#1-arquitectura-del-sistema)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto e Identificación de Código](#3-estructura-del-proyecto-e-identificación-de-código)
4. [Flujo de Usuario y Endpoints de la API](#4-flujo-de-usuario-y-endpoints-de-la-api)
5. [Configuración y Ejecución Local](#5-configuración-y-ejecución-local)
6. [Despliegue en Vercel y Neon.tech](#6-despliegue-en-vercel-y-neontech)
7. [Identidad Visual](#7-identidad-visual)
8. [Equipo](#8-equipo)

---

## 1. Arquitectura del Sistema

El proyecto implementa una **Arquitectura Serverless de 3 Capas (Three-Tier Serverless Architecture)** combinada con **JAMstack** para la entrega de activos estáticos:

1. **Capa de Presentación (Frontend Estático — Edge Network en Vercel):**
   - Servida directamente desde la carpeta `public/` mediante `@vercel/static`.
   - Construida con HTML5, CSS3 modular y JavaScript Vanilla (ES6+).
2. **Capa de Lógica de Negocio (Backend Serverless — Vercel Functions):**
   - Implementada en **Python con FastAPI** dentro de `api/index.py` y ejecutada como una función Serverless (`@vercel/python`).
   - El enrutador de `vercel.json` intercepta todas las peticiones `/api/(.*)` y las dirige a la instancia de FastAPI, mientras que el resto de rutas `/(.*)` sirven los archivos de `/public/$1`.
3. **Capa de Datos y Almacenamiento Externo:**
   - **Base de Datos Relacional:** **PostgreSQL Serverless** alojada en **Neon.tech** (AWS `us-east-1`), conectada mediante un *Connection Pooler* (`pool_pre_ping=True` y `sslmode=require`) a través de SQLAlchemy.
   - **Distribución de Binarios:** **GitHub Releases** aloja y distribuye el instalador oficial de escritorio (`BillZen.exe`).

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Cliente (Navegador)                          │
│         HTML5 / CSS3 / JS Vanilla (sessionStorage & localStorage)    │
└───────────────────┬──────────────────────────────────┬───────────────┘
                    │                                  │
       1. Peticiones Web y API (/api/*)   3. Descarga Directa (Autenticado)
                    │                                  │
                    ▼                                  ▼
┌───────────────────────────────────────┐  ┌───────────────────────────┐
│            Vercel Cloud               │  │      GitHub Releases      │
│                                       │  │                           │
│  ┌──────────────┐   ┌──────────────┐  │  │  Instalador Escritorio:   │
│  │ @vercel/     │   │ @vercel/     │  │  │  releases/download/1.0/   │
│  │ static       │   │ python       │  │  │  BillZen.exe              │
│  │ (/public/*)  │   │ (FastAPI)    │  │  └───────────────────────────┘
│  └──────────────┘   └──────┬───────┘  │
└────────────────────────────┼──────────┘
                             │ 2. SQLAlchemy ORM + Psycopg2 (SSL Pooler)
                             ▼
┌───────────────────────────────────────┐
│       Neon.tech (Serverless DB)       │
│     PostgreSQL — Tabla: `empresas`    │
└───────────────────────────────────────┘
```

---

## 2. Stack Tecnológico

### Frontend
- **Lenguajes:** HTML5 semántico, CSS3 con variables nativas (Custom Properties), JavaScript Vanilla (ES6+).
- **Tipografías:** *Fraunces* (Títulos y display), *Sora* (Interfaz y cuerpo), *DM Mono* (NITs, etiquetas técnicas y precios).
- **Gestión de estado de sesión:** `sessionStorage` y `localStorage` (`bz_empresa_nit`, `bz_empresa_nombre`).

### Backend (API Serverless)
- **Lenguaje:** Python 3.11+
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **ORM:** [SQLAlchemy](https://www.sqlalchemy.org/) + `psycopg2-binary`
- **Seguridad:** Encriptación de contraseñas con `bcrypt` (generación de *salt* y verificación de *hash*).
- **Validación de Datos:** `Pydantic` (`BaseModel`).

### Infraestructura y Nube
- **Hosting & Serverless Functions:** [Vercel](https://vercel.com/)
- **Base de Datos Cloud:** [Neon.tech](https://neon.tech/) (PostgreSQL Serverless)
- **Repositorio y Releases:** [GitHub — bill-zen-desarrollo](https://github.com/bill-zen-desarrollo)

---

## 3. Estructura del Proyecto e Identificación de Código

```
bill_zen_users/
│
├── api/                         # Backend Serverless (FastAPI)
│   ├── database.py              # Conexión a PostgreSQL (Neon.tech) y sesión SQLAlchemy
│   ├── models.py                # Modelo ORM de la tabla `empresas`
│   └── index.py                 # Punto de entrada FastAPI y endpoints (/api/register, /api/login)
│
├── public/                      # Frontend estático servido por Vercel
│   ├── index.html               # Landing page principal (Funcionalidades, Planes, Descargas)
│   ├── login.html               # Vista unificada de Inicio de Sesión y Registro de empresas
│   ├── blog.html                # Artículo informativo sobre facturación electrónica y PYMEs
│   ├── proximamente.html        # Página informativa para módulos/planes en desarrollo
│   │
│   ├── css/
│   │   ├── index.css            # Estilos globales y de la landing page
│   │   ├── login.css            # Estilos del módulo de autenticación y modales
│   │   ├── blog.css             # Estilos de lectura y barra de progreso del blog
│   │   └── proximamente.css     # Estilos de la tarjeta "Estamos trabajando para ti"
│   │
│   ├── js/
│   │   ├── config.js            # Detección automática de entorno (localhost vs Vercel /api)
│   │   ├── index.js             # Lógica de landing: sesión en navbar, animaciones y descargas
│   │   ├── login.js             # Lógica de fetch (/login, /register), validación y modales
│   │   └── blog.js              # Barra de progreso de lectura y sesión en el blog
│   │
│   └── img/
│       └── logo-mark.svg        # Logotipo vectorial de BillZen
│
├── .env                         # Variables de entorno locales (DATABASE_URL de Neon.tech)
├── requirements.txt             # Dependencias de Python para Vercel
├── vercel.json                  # Reglas de construcción y enrutamiento en Vercel
└── README.md                    # Documentación del proyecto
```

### Detalle de los archivos clave

#### Backend (`api/`)
- **`api/database.py`**: Carga la variable `DATABASE_URL` desde el entorno, crea el motor de SQLAlchemy con `pool_pre_ping=True` (esencial para conexiones serverless en Neon que entran en reposo) y provee el generador `get_db()` para inyección de dependencias.
- **`api/models.py`**: Define el modelo `Empresa` mapeado a la tabla `empresas` en PostgreSQL con las columnas: `id`, `razon_social`, `nit` (único), `nombres_admin`, `apellidos_admin`, `email` (único) y `hashed_password`.
- **`api/index.py`**: Configura la aplicación FastAPI, el middleware CORS, los esquemas Pydantic (`EmpresaCreate` y `EmpresaLogin`) y los endpoints `POST /api/register` y `POST /api/login`.

#### Frontend (`public/`)
- **`public/js/config.js`**: Define `API_BASE_URL`. Si detecta que se ejecuta en `localhost` o `127.0.0.1`, apunta a `http://127.0.0.1:8000/api`; si está en producción (Vercel), apunta a la ruta relativa `/api`.
- **`public/js/login.js`**:
  - `switchTab(tab)`: Alterna entre las pestañas de *Iniciar sesión* y *Crear cuenta*.
  - `handleLogin(e)`: Envía `nit` y `password` a `POST /api/login`, guarda la sesión en `sessionStorage`/`localStorage` y redirige a `index.html` (o a `#descargar` si venía desde el botón de descarga).
  - `handleRegister(e)`: Registra una nueva empresa en `POST /api/register`, realiza auto-login transparente y redirige al usuario.
- **`public/js/index.js`**:
  - `initAuth()` y `handleLogout()`: Muestra en la barra de navegación superior el chip con las iniciales, razón social y NIT de la empresa cuando hay sesión activa, o los botones *Iniciar sesión / Registrarse* cuando es visitante.
  - `initDownloads()`: Verifica si el usuario tiene sesión activa antes de descargar `BillZen.exe` desde GitHub Releases; si no ha iniciado sesión, lo redirige a `login.html?redirect=descargar#register`.

---

## 4. Flujo de Usuario y Endpoints de la API

### Endpoints disponibles

| Método | Ruta | Cuerpo (JSON) | Respuesta exitosa | Descripción |
|--------|------|---------------|-------------------|-------------|
| `POST` | `/api/register` | `{ razon_social, nit, nombres_admin, apellidos_admin, email, password }` | `200 OK` — `{"message": "Empresa registrada exitosamente"}` | Valida que el NIT y el correo no existan, encripta la contraseña con `bcrypt` y crea el registro en Neon.tech. |
| `POST` | `/api/login` | `{ nit, password }` | `200 OK` — `{"message": "Login exitoso", "nombre_empresa": "...", "software_download_url": "..."}` | Verifica el NIT y compara el hash de la contraseña con `bcrypt.checkpw`. |

---

## 5. Configuración y Ejecución Local

### 1. Clonar el repositorio y crear entorno virtual
```bash
git clone https://github.com/bill-zen-desarrollo/bill_zen_users.git
cd bill_zen_users
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install uvicorn python-dotenv bcrypt
```

### 2. Configurar variables de entorno
Crear un archivo `.env` en la raíz con la cadena de conexión de Neon.tech:
```env
DATABASE_URL="postgresql://usuario:password@host.neon.tech/bill_zen?sslmode=require"
```

### 3. Iniciar el servidor Backend (FastAPI)
```bash
uvicorn api.index:app --reload --port 8000
```
- Documentación interactiva Swagger disponible en: `http://127.0.0.1:8000/api/docs`

### 4. Abrir el Frontend
Puedes abrir `public/index.html` con la extensión **Live Server** de VS Code / Antigravity o servir la carpeta `public`:
```bash
python -m http.server 3000 --directory public
```

---

## 6. Despliegue en Vercel y Neon.tech

1. **Base de datos en Neon.tech:**
   - El proyecto se conecta a una instancia PostgreSQL Serverless en Neon.
   - Al iniciar la función en `api/index.py`, la instrucción `models.Base.metadata.create_all(bind=database.engine)` garantiza que la tabla `empresas` exista.
2. **Despliegue en Vercel:**
   - En el panel de Vercel (**Settings → Environment Variables**), se configura la variable `DATABASE_URL` con la URL del Pooler de Neon.tech.
   - `vercel.json` compila `api/index.py` con `@vercel/python` y sirve `public/**` con `@vercel/static`.

---

## 7. Identidad Visual

| Variable CSS | Color | Uso principal |
|--------------|-------|---------------|
| `--accent` | `#0a6f52` | Verde principal de marca, botones primarios y enlaces activos |
| `--bg` | `#f5f3ef` | Fondo cálido general de la aplicación |
| `--dark` | `#0f1117` | Fondos oscuros (Hero, tarjetas destacadas, Footer) |
| `--surface` | `#ffffff` | Superficie de tarjetas y formularios |
| `#F5A623` | Naranja | Indicadores de estado en proceso (ej. *DIAN en proceso*) |

---

## 8. Equipo y Contacto

- **Juan Camilo Rojas** — Co-fundador & Frontend
- **Camilo Alarcón** — Co-fundador & Backend
- **GitHub Organización:** [bill-zen-desarrollo](https://github.com/bill-zen-desarrollo)
- **Correo de contacto:** [zentech.solutions.co@gmail.com](mailto:zentech.solutions.co@gmail.com)
- **WhatsApp:** [+57 322 310 9301](https://wa.me/573223109301)
