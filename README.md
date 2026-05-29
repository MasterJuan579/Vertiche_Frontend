# Vertiche SortFlow — Frontend Monorepo

Trazabilidad RFID en tiempo real para el centro de distribución (CEDIS) de una cadena de moda. Cuatro módulos especializados conviven dentro de un único shell de Vite, desplegado como **un solo proyecto en Vercel** con una sola URL.

> Este repositorio contiene **solo el frontend**. El backend (Node + TypeScript + Express + Sequelize + MySQL) vive en `vertiche-backend` y se despliega aparte sobre EC2.

---

## Arquitectura

```
┌───────────────────────────────────────────────────────────────┐
│           apps/web  ──  shell único, una sola URL             │
│                                                               │
│   /                  → login                                  │
│   /nueva-contrasena  → cambio de contraseña (primer ingreso)  │
│   /admin/*           → ADMIN         (apps/admin)            │
│   /rfid/*            → SUPERVISOR    (apps/rfid)              │
│   /sorter/*          → BAY_OPERATOR  (apps/sorter)            │
│   /dashboard/*       → OPS_MANAGER   (apps/dashboard)         │
│   /proveedores/*     → QA_INSPECTOR  (apps/proveedores)       │
└───────────────────────────────────────────────────────────────┘
```

El shell monta cada módulo bajo su prefijo y lo envuelve en `<RequireRole role="...">`. Un usuario autenticado que intente entrar a un módulo que no le corresponde es redirigido a su propio módulo. Sin sesión, todo redirige a `/`.

La sesión vive en un `AuthProvider` (React context) que persiste en `sessionStorage`. El login real usa AWS Cognito (flujo `USER_PASSWORD_AUTH`, vía `fetch` directo) y luego consulta `GET /Auth/me` para resolver el rol desde MySQL. La sesión tiene la forma `{ idToken, accessToken, refreshToken, user: { sub, email, role, nombre } }`.

---

## Autenticación

Integración real de AWS Cognito + backend. Roles y su módulo destino:

- `ADMIN` → `/admin`
- `SUPERVISOR` → `/rfid`
- `BAY_OPERATOR` → `/sorter`
- `OPS_MANAGER` → `/dashboard`
- `QA_INSPECTOR` → `/proveedores`

El rol **no** vive en Cognito: lo determina el backend desde la tabla `Usuario` de MySQL y se obtiene con `GET /Auth/me`. Cada endpoint protegido re-verifica el token y el rol. El alta de usuarios está deshabilitada en Cognito; solo un `ADMIN` puede crear cuentas desde el módulo `/admin` (`POST /Auth/registrar`).

Configuración local:

1. Copia `apps/web/.env.example` a `apps/web/.env.local`.
2. Completa las variables de Cognito (`VITE_COGNITO_*`) y `VITE_API_URL`.
3. `npm install && npm run dev`.
4. El backend debe estar corriendo en `VITE_API_URL`.

---

## Estructura del monorepo

```
vertiche-frontend/
├── apps/
│   ├── web/             Shell único (Vite, Tailwind, Vercel target)
│   ├── auth/            Páginas de login + cambio de contraseña
│   ├── admin/           Módulo del administrador (gestión de usuarios)
│   ├── rfid/            Módulo del supervisor
│   ├── sorter/          Módulo del operador de bahía
│   ├── dashboard/       Módulo del gerente operativo
│   └── proveedores/     Módulo del inspector QA
├── packages/
│   ├── design-system/   Tokens, componentes compartidos, AuthProvider
│   └── mock-data/       Datos mock alineados con el schema del backend
└── .github/
    └── workflows/
        └── sync-branches.yml   Sincronización automática staging → team-*
```

Solo `apps/web/` tiene `vite.config.js`, `tailwind.config.js`, `index.html` y `vercel.json`. Los módulos (`auth`, `admin`, `rfid`, `sorter`, `dashboard`, `proveedores`) son librerías que exportan un componente — el shell los importa y monta.

`npm workspaces` resuelve los paquetes locales (`@vertiche/design-system`, `@vertiche/mock-data`) sin necesidad de publicar a npm.

---

## Stack técnico

- **Vite 5** + **React 18** (JavaScript, no TypeScript)
- **React Router 6** — todo el routing vive en el shell + módulos
- **Tailwind CSS 3** con preset compartido en `@vertiche/design-system`
- **npm workspaces** para gestión del monorepo
- **Vercel** para hosting (un solo proyecto)
- **GitHub Actions** para sincronización automática entre ramas
- **Zustand + Chart.js + PDF export** en el módulo `dashboard`

---

## Cómo correr localmente

### Primera vez

```bash
git clone git@github.com:MasterJuan579/Vertiche_Frontend.git
cd Vertiche_Frontend
npm install
```

`npm install` desde la raíz instala dependencias para todos los workspaces de una sola pasada. El archivo `.npmrc` activa `legacy-peer-deps=true` para evitar conflictos de peer dependencies en npm 7+.

### Correr el shell

```bash
npm run dev          # http://localhost:5173
```

Un solo comando levanta el shell con todos los módulos montados. No hace falta arrancar cada módulo por separado.

El dashboard consume el backend con `VITE_API_URL`. Como Vite se ejecuta desde `apps/web`, crea el archivo local ahí:

```bash
cp apps/web/.env.example apps/web/.env
```

Valor esperado para desarrollo local:

```env
VITE_API_URL=http://localhost:8080
```

### Probar el flujo end-to-end

1. `npm run dev`
2. Abre `http://localhost:5173`
3. Llena el formulario de login con cualquier credencial (modo demo)
4. Elige un rol — el shell te lleva a `/rfid`, `/sorter`, `/dashboard` o `/proveedores`
5. Intenta visitar manualmente un módulo distinto al de tu rol — `RequireRole` te redirige al correcto

### Build de producción

```bash
npm run build        # genera apps/web/dist
npm run preview      # sirve el build localmente para verificar
```

---

## Despliegue en Vercel

**Un solo proyecto de Vercel.** Configuración desde el dashboard:

| Setting | Valor |
|---------|-------|
| Project Root | `apps/web` |
| Framework Preset | Vite |
| Build Command | `cd ../.. && npm run build` |
| Install Command | `cd ../.. && npm install` |
| Output Directory | `dist` |
| Production Branch | `prod` |

El `cd ../..` salta a la raíz del monorepo antes de correr el comando — necesario porque los workspaces se resuelven desde la raíz, no desde `apps/web`.

### Variables de entorno

Para el módulo `dashboard` se requiere la URL del backend:

```
VITE_API_URL
```

Cuando se integre AWS Cognito, agregar también en Vercel (Settings → Environment Variables, separadas para Production y Preview):

```
VITE_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID
```

El prefijo `VITE_` es obligatorio: Vite solo expone al cliente las variables que lo tengan.

### Ramas que despliegan

Vercel está configurado (vía `apps/web/vercel.json`) para desplegar solamente `prod` y `staging`. Las ramas `team-*` **no** generan previews automáticos — son ramas de desarrollo paralelo, no candidatos a deploy.

---

## Modelo de ramas

Lee `CONTRIBUTING.md` para la guía detallada del flujo de trabajo. Resumen rápido:

```
prod              ← producción. Solo recibe PRs desde staging.
staging           ← integración. Recibe PRs de las cuatro ramas team-*.
team-rfid         ← trabajo en curso del equipo RFID
team-sorter       ← trabajo en curso del equipo Sorter
team-dashboard    ← trabajo en curso del equipo Dashboard
team-proveedores  ← trabajo en curso del equipo Proveedores
```

Tanto `prod` como `staging` tienen protección activa: requieren PR + 1 aprobación, bloquean force pushes y bloquean borrado.

Una GitHub Action corre todos los días a las 03:00 CDMX (`0 9 * * *` UTC) y sincroniza `staging` hacia las cuatro ramas `team-*`. Si encuentra conflictos, abre un issue etiquetado para el equipo dueño de la rama afectada.

---

## Roles y módulos

| Rol Cognito | Módulo destino | Lo que ve |
|-------------|----------------|-----------|
| `SUPERVISOR` | rfid | Flujo del CEDIS (Gantt con 25 OCs activas + grid de 10 bahías en 3 zonas), bitácora de lecturas con filtros por etapa, trazabilidad EPC con timeline horizontal y registro de tags RFID |
| `BAY_OPERATOR` | sorter | Vista de sorter en vivo (con alerta dramática "Error de Sorter" para prepacks mal direccionados), directorio de las 10 bahías y vista por bahía con 3 estaciones más panel de detalle del prepack |
| `OPS_MANAGER` | dashboard | Operación en vivo conectada a API, throughput, etapas RFID, anomalías y exportación PDF |
| `QA_INSPECTOR` | proveedores | Pantalla de inspección (flujo de siniestros en 3 pasos), resumen del turno, plan de muestreo y ficha detallada por proveedor con historial QA |

El rol está en el claim `custom:role` del JWT (alineado con la práctica estándar de Cognito).

---

## Sistema de diseño — Dashboard Industrial Limpio

El paquete `@vertiche/design-system` define tokens, componentes y el `AuthProvider`:

- **Colores semánticos**: `flow` (verde, en operación), `attention` (ámbar, requiere atención), `anomaly` (rojo, problema real). El rojo solamente se usa para anomalías reales, nunca como tono decorativo.
- **Tipografía**: Space Grotesk para display, Inter para body, JetBrains Mono para datos.
- **Acentos por módulo**: cada módulo tiene un color de marca propio (`#1E40AF` rfid, `#7C3AED` sorter, `#0F766E` dashboard, `#C2410C` proveedores). Se usan en barras superiores, badges y bordes — nunca como fondos completos.
- **KPIs grandes**: el director del CEDIS lee la pantalla desde el otro lado del cuarto. Los KPIs principales son de 40-56px.

### Auth API

```jsx
import { AuthProvider, useAuth, RequireRole } from '@vertiche/design-system';

// En main.jsx del shell:
<AuthProvider><App /></AuthProvider>

// En cualquier componente:
const { session, signIn, signOut } = useAuth();

// Para proteger un módulo:
<RequireRole role="SUPERVISOR"><RfidModule /></RequireRole>
```

### Theme (modo claro / oscuro)

```jsx
import { ThemeProvider, useTheme, ThemeToggle } from '@vertiche/design-system';
```

El shell ya envuelve toda la app en `<ThemeProvider>`, y `<ThemeToggle />` vive en el `AppShell` (esquina inferior izquierda, junto al botón de Salir). El estado se persiste en `localStorage` bajo la clave `vertiche.theme` y respeta la preferencia del sistema operativo en la primera visita.

**Importante**: el toggle aparece en los cuatro módulos pero solo **proveedores**, **sorter** y **rfid** tienen variantes `dark:` completas en sus clases. El módulo `dashboard` se ve igual sin importar el toggle hasta que su equipo agregue variantes `dark:` a sus páginas. Esto es intencional — permite adopción gradual del modo oscuro sin bloquear la salida del refactor.

---

## Datos mock

`@vertiche/mock-data` exporta colecciones alineadas con el schema del backend:

- 7 `proveedores` con ratings, niveles, métricas de QA
- 20 `tiendas` repartidas entre 8 bahías
- 25 `ordenes` activas en diferentes estadios
- 18 `palets` en proceso
- 20 `tags` (EPCs) con SKU, color, talla, destino
- 5 `anomalias` recientes
- 7 estadios del proceso RFID

El módulo `dashboard` ya consume la API real mediante `VITE_API_URL` y no usa `@vertiche/mock-data`. Los demás módulos todavía pueden usar datos mock mientras migran por equipo.

---

## Roadmap inmediato

- [ ] Conectar el módulo `rfid` con el endpoint `/api/palets` del backend
- [ ] Proteger los controladores restantes del backend con `verifyToken` + `requireRole`
- [ ] Configurar dominio custom (`vertiche.mx`)
- [ ] Agregar Vitest + una prueba de smoke por módulo
- [ ] Agregar pruebas E2E con Playwright

---

# Hola

Hecho con cuidado por el equipo Vertiche · Tec de Monterrey CEM · 2026
