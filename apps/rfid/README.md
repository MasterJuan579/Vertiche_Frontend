# apps/rfid — Módulo RFID (frontend)

> **Responsable:** team-rfid (Moisés Falcón).
> **Rama:** `team-rfid`.
> **Stack:** React 18 + Vite + Tailwind + socket.io-client.

Pantallas del supervisor del CEDIS para operar y monitorear el flujo RFID.

---

## Pantallas

| Ruta | Pantalla | Qué hace |
|---|---|---|
| `/rfid` | **Flujo CEDIS** | Gantt de OCs activas + grid de bahías. Push de Socket.IO. |
| `/rfid/bitacora` | **Bitácora** | Stream en vivo de lecturas + panel de anomalías con botón ✕ para resolver. |
| `/rfid/trazabilidad` | **Trazabilidad** | Buscar por EPC o SKU. Timeline con etapas y anomalías marcadas. |
| `/rfid/vinculacion` | **Registrar Tag** | Formulario para dar de alta un prepack (EPC, SKU, tienda, proveedor, palet). |

## Estructura

```
apps/rfid/src/
├── index.jsx              ← export RfidModule + rutas
├── pages/                 ← las 4 pantallas
├── components/            ← ModalOC, EventoRow, AnomaliaAlert, etc.
├── services/
│   ├── realApi.js         ← cliente HTTP con fetch + auth header
│   └── socketClient.js    ← cliente Socket.IO singleton
├── data/etapas.js         ← constantes UI (etapas, colores)
└── utils/                 ← format de hora/dur, helpers
```

## Componentes UI reutilizables (inline en las páginas)

Vivien dentro de `Vinculacion.jsx` y `Trazabilidad.jsx` por proximidad de uso. Si crecen, considerar moverlos a `components/`:

- **`ProductIcon`** — SVG inline que detecta el tipo de prenda (camiseta, pantalón, vestido, etc.) por keywords del SKU o categoría del proveedor. Reemplaza emojis para mejor consistencia visual y soporte de dark mode.
- **`StoreIcon`** — ícono SVG de tienda destino.
- **`StarIcon` + `StarRow`** — visualización de calificación (1-5 estrellas).
- **`ProveedorRatingChip`** — bloque compacto con StarRow + chip de nivel (ELITE/MEDIA/BAJA) + % aprobación. Usado en Modal Nueva OC, panel "Orden de compra activa" y Trazabilidad.
- **`ColorPicker`** — selector visual de color con paleta cerrada de 14 swatches + input libre. Normaliza el valor a Title Case ("azul" → "Azul").
- **`RefreshIcon`** — botón "Actualizar" en FlujoCEDIS.

## Configuración

Crear `.env` en `apps/web/`:
```
VITE_API_URL=http://localhost:8080
```

> **Nota**: usamos `VITE_API_URL` (la misma variable que el resto del monorepo). Por compatibilidad con setups anteriores, el módulo también acepta `VITE_API_BASE_URL` como alias, pero `VITE_API_URL` tiene prioridad.

En **Vercel** (deploy de prod/staging) la variable debe apuntar a la API Gateway:
```
VITE_API_URL=https://ev4km5col1.execute-api.us-east-1.amazonaws.com
```
porque Vercel sirve por HTTPS y el EC2 directo (HTTP) sería bloqueado por *mixed content* del navegador.

## Cómo correrlo

Desde la raíz del monorepo:
```bash
npm install
npm run dev
```
Abre `http://localhost:5173`. Login con cualquier email/password (mockSignIn), rol `SUPERVISOR` para entrar a `/rfid`.

## Eventos Socket.IO que escucha

| Evento | Reacciona |
|---|---|
| `lectura` | Bitácora prepend, FlujoCEDIS recarga, Trazabilidad refresca si es el EPC activo. |
| `anomalia` | Bitácora prepend en panel derecho. |
| `tag` | FlujoCEDIS recarga, Trazabilidad refresca si es el EPC activo. |
| `uid-detectado` | Modal "Asignar EPC" en Vinculación autocompleta el input cuando llega un UID del Lector 1 del ESP32. |
| `prepack-asignado` | Vinculación refresca el grid de prepacks (la celda asignada pasa de gris a verde). |
| `proveedor-actualizado` | (No usado en RFID directamente — pero el frontend de team-proveedores puede suscribirse para refrescar el rating sin polling). |

## Documentación completa

El documento principal del módulo (flujo, endpoints, contrato del ESP32, setup) vive en el repo del backend: **[Vertiche_Backend/docs/RFID_MODULE.md](https://github.com/MasterJuan579/Vertiche_Backend/blob/dev/docs/RFID_MODULE.md)**.
