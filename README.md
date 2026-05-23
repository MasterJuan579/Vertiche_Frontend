# Vertiche SortFlow — Frontend Monorepo

Trazabilidad RFID en tiempo real para el centro de distribución (CEDIS) de una cadena de moda. Cinco aplicaciones especializadas, un sistema de diseño compartido, mock-data común. Pensado para desplegar cada módulo en su propio Vercel.

> Este repositorio contiene **solo el frontend**. El backend (Node + TypeScript + Express + Sequelize + MySQL) vive en `vertiche-backend` y se despliega aparte sobre EC2.

---

## Arquitectura



```
┌──────────────────────────────────────────────────────────┐
│              auth.vercel.app  (Login + Role picker)      │
│        Cualquier usuario aterriza aquí primero.          │
└──────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼              ▼
   ┌─────────┐       ┌─────────┐       ┌──────────┐  ┌────────────┐
   │  rfid   │       │ sorter  │       │dashboard │  │proveedores │
   │SUPERVISOR│      │OPERATOR │       │  OPS_MGR │  │QA_INSPECTOR│
   └─────────┘       └─────────┘       └──────────┘  └────────────┘
```

El módulo `auth` mockea AWS Cognito. Después del login, redirige al usuario al módulo correspondiente con un JWT mock en el fragmento de la URL (`#token=...`). Cada módulo lee el token, valida el rol con `ensureRole(...)`, y si no coincide redirige al módulo correcto.

En producción, AWS Cognito reemplazará a `mockSignIn(...)` directamente, sin tocar el resto del flujo.

---

## Estructura del monorepo

```
vertiche-frontend/
├── apps/
│   ├── auth/           Login + selector de rol (puerto 5173)
│   ├── rfid/           Vista del supervisor (puerto 5174)
│   ├── sorter/         Vista del operador de bahía (puerto 5175)
│   ├── dashboard/      Vista del gerente operativo (puerto 5176)
│   └── proveedores/    Vista del inspector QA (puerto 5177)
├── packages/
│   ├── design-system/  Tokens de Tailwind + componentes React compartidos
│   └── mock-data/      Datos mock alineados con el schema del backend
└── .github/
    └── workflows/
        └── sync-branches.yml   Sincronización automática staging → team
```

`npm workspaces` resuelve los paquetes locales (`@vertiche/design-system`, `@vertiche/mock-data`) sin necesidad de publicar a npm.

---

## Stack técnico

- **Vite** + **React 18** (JavaScript, no TypeScript)
- **Tailwind CSS** con preset compartido en `design-system`
- **React Router** v6 para navegación dentro de cada módulo
- **npm workspaces** para gestión del monorepo
- **GitHub Actions** para sincronización automática entre ramas

---

## Cómo correr localmente

### Primera vez

```bash
git clone git@github.com:Moises-Falcon/vertiche-sortflow.git
cd vertiche-sortflow
npm install
```

`npm install` desde la raíz instala dependencias para todos los workspaces de una sola pasada.

### Correr una sola app

```bash
npm run dev:auth          # auth en :5173
npm run dev:rfid          # rfid en :5174
npm run dev:sorter        # sorter en :5175
npm run dev:dashboard     # dashboard en :5176
npm run dev:proveedores   # proveedores en :5177
```

### Probar el flujo end-to-end

1. Levanta el módulo `auth` en una terminal.
2. Levanta el módulo objetivo (`rfid`, `sorter`, `dashboard` o `proveedores`) en otra.
3. Abre `http://localhost:5173`, llena el formulario con cualquier credencial.
4. Elige un rol — serás redirigido al módulo correspondiente con un token mock.

### Build de todas las apps

```bash
npm run build:all
```

---

## Despliegue en Vercel

Cada app es un proyecto independiente de Vercel. Conecta el mismo repositorio y configura por proyecto:

| App | Root directory | Build Command | Output Directory |
|-----|----------------|---------------|------------------|
| auth | `apps/auth` | `cd ../.. && npm run build --workspace=auth` | `apps/auth/dist` |
| rfid | `apps/rfid` | `cd ../.. && npm run build --workspace=rfid` | `apps/rfid/dist` |
| sorter | `apps/sorter` | `cd ../.. && npm run build --workspace=sorter` | `apps/sorter/dist` |
| dashboard | `apps/dashboard` | `cd ../.. && npm run build --workspace=dashboard` | `apps/dashboard/dist` |
| proveedores | `apps/proveedores` | `cd ../.. && npm run build --workspace=proveedores` | `apps/proveedores/dist` |

### Variables de entorno (Vercel)

Configura en **cada** proyecto (todas apuntando a los URLs `.vercel.app` reales):

```
VITE_AUTH_URL=https://vertiche-auth.vercel.app
VITE_RFID_URL=https://vertiche-rfid.vercel.app
VITE_SORTER_URL=https://vertiche-sorter.vercel.app
VITE_DASHBOARD_URL=https://vertiche-dashboard.vercel.app
VITE_PROVEEDORES_URL=https://vertiche-proveedores.vercel.app
```

Sin estas, en producción los módulos siguen redirigiendo a `localhost`.

### Ramas que despliegan

Vercel está configurado (vía `vercel.json` en cada app) para desplegar solamente `prod` y `staging`. Las ramas `team-*` **no** despliegan automáticamente — son ramas de desarrollo paralelo.

---

## Modelo de ramas

Lee `CONTRIBUTING.md` para la guía detallada del flujo de trabajo. Resumen rápido:

```
prod            ← rama de producción, solo merges desde staging
staging         ← rama de integración, recibe PRs de las cuatro ramas team-*
team-sorter     ← trabajo en curso del equipo Sorter (no se despliega)
team-rfid       ← trabajo en curso del equipo RFID
team-dashboard  ← trabajo en curso del equipo Dashboard
team-proveedores ← trabajo en curso del equipo Proveedores
```

Una GitHub Action corre cada noche y sincroniza `staging` hacia las cuatro ramas `team-*`. Si encuentra conflictos, abre un issue etiquetado para el equipo dueño de la rama afectada.

---

## Roles y módulos

| Rol Cognito | Módulo destino | Lo que ve |
|-------------|----------------|-----------|
| `SUPERVISOR` | rfid | Flujo CEDIS, pedidos, palets, trazabilidad EPC, lecturas live |
| `BAY_OPERATOR` | sorter | Vista de sorter, ocho bahías, estación con 3 terminales × 4 prepacks |
| `OPS_MANAGER` | dashboard | KPIs ejecutivos, productividad, anomalías |
| `QA_INSPECTOR` | proveedores | Ranking de proveedores, inspecciones QA, historial de anomalías |

El rol está en el claim `custom:role` del JWT (alineado con la práctica estándar de Cognito).

---

## Sistema de diseño — Dashboard Industrial Limpio

El paquete `@vertiche/design-system` define los tokens y componentes:

- **Colores semánticos**: `flow` (verde, en operación), `attention` (ámbar, requiere atención), `anomaly` (rojo, problema real). El rojo solamente se usa para anomalías reales, nunca como tono decorativo.
- **Tipografía**: Space Grotesk para display, Inter para body, JetBrains Mono para datos.
- **Acentos por módulo**: cada módulo tiene un color de marca propio (`#1E40AF` rfid, `#7C3AED` sorter, `#0F766E` dashboard, `#C2410C` proveedores). Se usan en barras superiores, badges y bordes — nunca como fondos completos.
- **KPIs grandes**: el director del CEDIS lee la pantalla desde el otro lado del cuarto. Los KPIs principales son de 40-56px.

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
- [ ] Configurar dominio custom (`vertiche.mx`) y subdominios por módulo
- [ ] Agregar pruebas E2E con Playwright
- [ ] Agregar Storybook al paquete `design-system`

---

Hecho con cuidado por el equipo Vertiche · Tec de Monterrey CEM · 2026
