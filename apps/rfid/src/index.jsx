import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, useAuth } from '@vertiche/design-system';
import { FlujoCEDIS } from './pages/FlujoCEDIS.jsx';
import { Bitacora } from './pages/Bitacora.jsx';
import { Trazabilidad } from './pages/Trazabilidad.jsx';
import { Vinculacion } from './pages/Vinculacion.jsx';

const ACCENT = '#1E40AF';

// Absolute paths so NavLink active-state compares against the real URL.
// Shell mounts this module at /rfid/*.
const NAV = [
  { to: '/rfid',               label: 'Flujo CEDIS',  end: true },
  { to: '/rfid/bitacora',      label: 'Bitácora' },
  { to: '/rfid/trazabilidad',  label: 'Trazabilidad' },
  { to: '/rfid/vinculacion',   label: 'Registrar Tag' },
];

export function RfidModule() {
  const { session, signOut } = useAuth();

  return (
    <AppShell
      moduleName="Supervisión RFID"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.nombre, role: 'Supervisor CEDIS' }}
      onLogout={signOut}
    >
      <Routes>
        {/* Default — full CEDIS flow with Gantt + bay grid */}
        <Route path="/" element={<FlujoCEDIS />} />

        {/* Event log (renamed from "Lecturas en Vivo" — no live sockets) */}
        <Route path="bitacora" element={<Bitacora />} />

        {/* EPC traceability — two patterns:
            - /rfid/trazabilidad           → empty search state
            - /rfid/trazabilidad/E001A     → auto-search that EPC on mount */}
        <Route path="trazabilidad" element={<Trazabilidad />} />
        <Route path="trazabilidad/:epc" element={<Trazabilidad />} />

        {/* Tag registration form */}
        <Route path="vinculacion" element={<Vinculacion />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/rfid" replace />} />
      </Routes>
    </AppShell>
  );
}
