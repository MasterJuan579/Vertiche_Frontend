# Módulo Proveedores — Contexto e Integración Backend

Este README documenta el alcance y plan de integración del módulo `proveedores` con el backend de Vertiche. Es la referencia que Claude debe leer al iniciar cualquier tarea sobre este módulo.

> **Scope de trabajo**: Solo se tocarán las carpetas [`apps/proveedores/`](./) y [`apps/web/`](../web/). Los módulos `rfid`, `sorter`, `dashboard` y `auth` están fuera del alcance.

---

## 1. Qué hace este módulo

Pantalla del **Inspector QA** (`QA_INSPECTOR`) que opera en el andén de recepción del CEDIS. Cuando llega un camión de un proveedor, el inspector:

1. Recibe la carga (un escenario con OC, proveedor, composición de prepacks).
2. Inspecciona una muestra cuyo tamaño se calcula según la calificación del proveedor (mayor calificación → menor muestreo).
3. Por cada prepack defectuoso reporta un **siniestro** en 3 pasos (Tipo → Escaneo RFID → Decisión final).
4. Al terminar la revisión, la calificación del proveedor se actualiza.

El módulo se monta bajo `/proveedores/*` desde [`apps/web/src/App.jsx`](../web/src/App.jsx) y está protegido por `<RequireRole role="QA_INSPECTOR">`.

---

## 2. Estructura de archivos

```
apps/proveedores/
├── package.json
└── src/
    ├── index.jsx                 ← Punto de entrada. Define rutas internas y AppShell
    ├── components/
    │   ├── NivelBadge.jsx        ← Pill ELITE/MEDIA/BAJA/NUEVO
    │   ├── OperatorBar.jsx       ← Barra superior con info del inspector logueado
    │   ├── Sparkline.jsx         ← Gráfica mini de tendencia de calificaciones
    │   └── Stars.jsx             ← Render de estrellas según rating
    ├── data/
    │   └── demoData.js           ← ⚠️ MOCK — a reemplazar con fetch al backend
    └── pages/
        ├── OperatorScreen.jsx    ← Pantalla principal: revisión activa + captura de siniestros
        ├── ResumenTurno.jsx      ← KPIs del turno + ranking de proveedores
        ├── PlanQA.jsx            ← Tabla con plan de muestreo por proveedor
        └── PerfilProveedor.jsx   ← Detalle de un proveedor (KPIs, historial, sparkline)
```

### Rutas internas (definidas en [`src/index.jsx`](./src/index.jsx))

| Ruta                       | Componente          | Función                                          |
|----------------------------|---------------------|--------------------------------------------------|
| `/proveedores`             | `OperatorScreen`    | Landing — flujo de inspección de carga           |
| `/proveedores/resumen`     | `ResumenTurno`      | KPIs del turno + lista de proveedores            |
| `/proveedores/plan`        | `PlanQA`            | Tabla de criterios de muestreo                   |
| `/proveedores/:proveedorId`| `PerfilProveedor`   | Detalle por ID (numérico)                        |

### El rol del shell ([`apps/web/`](../web/))

`apps/web` es **el único** que tiene `vite.config.js`, `tailwind.config.js` e `index.html`. Centraliza:

- [`src/main.jsx`](../web/src/main.jsx) → monta `<ThemeProvider><BrowserRouter><AuthProvider><App/></AuthProvider>...`
- [`src/App.jsx`](../web/src/App.jsx) → declara la ruta `/proveedores/*` envuelta en `<RequireRole role="QA_INSPECTOR">`

Importa el módulo como librería: `import { ProveedoresModule } from 'proveedores'` — esto funciona porque `npm workspaces` resuelve el paquete local.

---

## 3. Datos que consume hoy (mock)

Todo vive en [`src/data/demoData.js`](./src/data/demoData.js). Estas son las estructuras que el backend debe replicar (o que el frontend debe transformar al recibir).

### `SUPPLIERS_INITIAL` — Lista base de proveedores
```js
{ id, codigo: 'PROV-001', name, stars, level: 'ELITE'|'MEDIA'|'BAJA'|'NUEVO',
  color: 'ba'|'bb'|'bc'|'bn', origin }
```
Consumido por: `ResumenTurno`, `PlanQA`, `PerfilProveedor`, `OperatorScreen` (lookup).

### `SUPPLIER_PROFILES` — Detalle por proveedor (key = id numérico)
```js
{ rfc, contact, phone, email, address, category, since, paymentTerms,
  deliveries, approval, defects, leadtime,
  sparkData: number[12],
  history: [{ date, po, desc, result: 'ok'|'warn'|'fail', note }] }
```
Consumido por: `PerfilProveedor`, `OperatorScreen` (KPIs del header).

### `CARGO_SCENARIOS` — Cargas que entran al andén
```js
{ supplierId, po, qty,
  composition: [{ productId, color, talla, qty }] }
```
Consumido por: `OperatorScreen` (cicla entre escenarios al iniciar revisión).

### `PRODUCT_CATALOG`, `DEFECT_TYPES`, `MOCK_EPCS`, `COLOR_MAP`
Catálogos auxiliares. `DEFECT_TYPES` define las 8 categorías de defecto del flujo de siniestros. `MOCK_EPCS` simula lecturas RFID — en producción vendrá del lector real.

### Helpers
- `calcSampleSize(stars, qty)` → cuántos prepacks revisar (34% / 67% / 100% / 50%)
- `sampleHint(stars)` → texto descriptivo del muestreo
- `accionSistema(stars)` → `{ label, hint, cls }` para mostrar "FLUJO LIBRE" / "STOP ALEATORIO" / etc.

---

## 4. Plan de integración con backend (fetch)

> El backend ya tiene endpoints. Vamos a reemplazar los imports de `demoData.js` por llamadas `fetch()`.

### Estrategia general

1. **Crear `src/api/`** con un cliente fetch reutilizable que lea `import.meta.env.VITE_API_BASE_URL` y maneje:
   - Headers comunes (`Content-Type: application/json`, `Authorization: Bearer <token>` del `AuthProvider`).
   - Errores HTTP (status no-2xx → throw).
   - JSON parsing.

2. **Cada página obtiene sus datos con `useEffect` + `useState`** (loading / error / data). No vamos a meter React Query ni librerías de fetching todavía — un wrapper simple es suficiente.

3. **Mantener la forma de los datos**. Si el backend devuelve algo distinto, transformar en el cliente API para no tocar los componentes.

### Mapeo tentativo página → endpoint

| Página              | Hook / fetch                                          | Endpoint sugerido                          |
|---------------------|-------------------------------------------------------|--------------------------------------------|
| `ResumenTurno`      | Lista de proveedores + KPIs del turno                 | `GET /api/proveedores`, `GET /api/qa/turno` |
| `PlanQA`            | Lista de proveedores (los stars determinan el plan)   | `GET /api/proveedores`                     |
| `PerfilProveedor`   | Detalle por ID + historial                            | `GET /api/proveedores/:id`                 |
| `OperatorScreen`    | Próxima carga al andén + catálogos                    | `GET /api/cargas/proxima`, `GET /api/productos`, `GET /api/defectos` |
| `OperatorScreen`    | Al reportar siniestro                                 | `POST /api/inspeccion-qa`                  |
| `OperatorScreen`    | Al terminar revisión (actualizar calificación)        | `PUT /api/proveedores/:id/calificacion`    |

> Los nombres de endpoint son sugerencias. Cuando me pases los endpoints reales actualizo este README.

### Variables de entorno

Agregar a `apps/web/.env` (no commitear) o configurar en Vercel:
```
VITE_API_BASE_URL=http://localhost:3000   # dev
VITE_API_BASE_URL=https://api.vertiche.mx # prod
```
El prefijo `VITE_` es obligatorio (Vite solo expone al cliente las vars con ese prefijo).

### Autenticación

El token vive en `useAuth().session.token` (hoy es mock, mañana viene de Cognito). El cliente fetch debe inyectarlo en el header `Authorization` automáticamente.

---

## 5. Cómo correr localmente

Desde la raíz del monorepo (no desde `apps/proveedores`):

```bash
npm install            # primera vez, instala todos los workspaces
npm run dev            # http://localhost:5173
```

Flujo end-to-end:
1. Login con cualquier credencial (modo demo).
2. Elige el rol **Inspector QA** → te lleva a `/proveedores`.
3. Pulsa "Iniciar revisión" para procesar la siguiente carga del array `CARGO_SCENARIOS`.

---

## 6. Convenciones a respetar

- **JavaScript, no TypeScript.**
- **Tailwind con clases del design system**: `bg-flow`, `bg-attention`, `bg-anomaly`, `bg-rfid`, `text-ink-*`, etc. Definidos en `@vertiche/design-system`.
- **Dark mode**: todas las clases nuevas deben tener variante `dark:`. El módulo proveedores ya tiene soporte completo.
- **Color de acento del módulo**: `#C2410C` (definido en `ACCENT` en `index.jsx`).
- **No agregar archivos nuevos en el root**. Si necesitas helpers de fetch, créalos en `src/api/`.
- **No tocar otros módulos** (`rfid`, `sorter`, `dashboard`, `auth`) ni `packages/mock-data` salvo que sea estrictamente necesario.

---

## 7. Pendientes inmediatos

- [ ] Documentar endpoints reales del backend (esperando lista del usuario).
- [ ] Crear `src/api/client.js` con el wrapper de fetch + token.
- [ ] Reemplazar `SUPPLIERS_INITIAL` → `GET /api/proveedores` en `ResumenTurno` y `PlanQA`.
- [ ] Reemplazar `SUPPLIER_PROFILES[id]` → `GET /api/proveedores/:id` en `PerfilProveedor`.
- [ ] Reemplazar `CARGO_SCENARIOS` → `GET /api/cargas/proxima` en `OperatorScreen`.
- [ ] Implementar `POST /api/inspeccion-qa` al finalizar cada siniestro.
- [ ] Implementar `PUT /api/proveedores/:id/calificacion` en `finishReview`.
- [ ] Añadir estados de `loading` y `error` por página.
