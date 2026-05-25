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
│   /select-role       → selector de rol (modo demo)            │
│   /rfid/*            → SUPERVISOR    (apps/rfid)              │
│   /sorter/*          → BAY_OPERATOR  (apps/sorter)            │
│   /dashboard/*       → OPS_MANAGER   (apps/dashboard)         │
│   /proveedores/*     → QA_INSPECTOR  (apps/proveedores)       │
└───────────────────────────────────────────────────────────────┘
```

El shell monta cada módulo bajo su prefijo y lo envuelve en `<RequireRole role="...">`. Un usuario autenticado que intente entrar a un módulo que no le corresponde es redirigido a su propio módulo. Sin sesión, todo redirige a `/`.

La sesión vive en un `AuthProvider` (React context) que persiste en `sessionStorage`. En producción, `mockSignIn` se reemplaza con una llamada real a AWS Cognito — el resto del flujo no cambia porque la forma del session (`{ token, user: { sub, email, name, role } }`) es la misma que devuelve Cognito.

---

## Estructura del monorepo

```
vertiche-frontend/
├── apps/
│   ├── web/             Shell único (Vite, Tailwind, Vercel target)
│   ├── auth/            Páginas de login + selector de rol
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

Solo `apps/web/` tiene `vite.config.js`, `tailwind.config.js`, `index.html` y `vercel.json`. Los cuatro módulos (`auth`, `rfid`, `sorter`, `dashboard`, `proveedores`) son librerías que exportan un componente — el shell los importa y monta.

`npm workspaces` resuelve los paquetes locales (`@vertiche/design-system`, `@vertiche/mock-data`) sin necesidad de publicar a npm.

---

## Stack técnico

- **Vite 5** + **React 18** (JavaScript, no TypeScript)
- **React Router 6** — todo el routing vive en el shell + módulos
- **Tailwind CSS 3** con preset compartido en `@vertiche/design-system`
- **npm workspaces** para gestión del monorepo
- **Vercel** para hosting (un solo proyecto)
- **GitHub Actions** para sincronización automática entre ramas

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

No se requieren variables de entorno mientras la autenticación esté mockeada. Cuando se integre AWS Cognito, agregar en Vercel (Settings → Environment Variables, separadas para Production y Preview):

```
VITE_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID
VITE_API_BASE_URL
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
| `SUPERVISOR` | rfid | Flujo CEDIS, pedidos, palets, trazabilidad EPC, lecturas live |
| `BAY_OPERATOR` | sorter | Vista de sorter, ocho bahías, estación con 3 terminales × 4 prepacks |
| `OPS_MANAGER` | dashboard | KPIs ejecutivos, productividad, anomalías |
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

**Importante**: el toggle aparece en los cuatro módulos pero solo **proveedores** tiene variantes `dark:` completas en sus clases. Los módulos `rfid`, `sorter` y `dashboard` se ven igual sin importar el toggle hasta que cada equipo agregue variantes `dark:` a sus páginas. Esto es intencional — permite adopción gradual del modo oscuro sin bloquear la salida del refactor.

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

Cuando el backend esté disponible, basta con reemplazar los imports de `@vertiche/mock-data` por llamadas a `fetch(...)` en cada vista. La forma de los datos no cambia.

---

## Roadmap inmediato

- [ ] Conectar el módulo `rfid` con el endpoint `/api/palets` del backend
- [ ] Reemplazar `mockSignIn(...)` con AWS Cognito real
- [ ] Configurar dominio custom (`vertiche.mx`)
- [ ] Agregar Vitest + una prueba de smoke por módulo
- [ ] Agregar pruebas E2E con Playwright

---

Hecho con cuidado por el equipo Vertiche · Tec de Monterrey CEM · 2026
