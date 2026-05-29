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

## Configuración

Crear `.env` en la **raíz del monorepo** (`Vertiche_Frontend/.env`):
```
VITE_API_BASE_URL=http://localhost:8080
```

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

## Documentación completa

El documento principal del módulo (flujo, endpoints, contrato del ESP32, setup) vive en el repo del backend: **[Vertiche_Backend/docs/RFID_MODULE.md](https://github.com/MasterJuan579/Vertiche_Backend/blob/dev/docs/RFID_MODULE.md)**.
