import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, useAuth } from '@vertiche/design-system';
import { FlujoCEDIS } from './pages/FlujoCEDIS.jsx';
import { Pedidos } from './pages/Pedidos.jsx';
import { DetallePalet } from './pages/DetallePalet.jsx';
import { Trazabilidad } from './pages/Trazabilidad.jsx';
import { LecturasLive } from './pages/LecturasLive.jsx';

const ACCENT = '#1E40AF';

// Nav items use absolute paths so the AppShell's NavLink components highlight
// correctly. The shell mounts this module at "/rfid/*".
const NAV = [
  { to: '/rfid', label: 'Flujo CEDIS', end: true },
  { to: '/rfid/pedidos', label: 'Pedidos & Palets' },
  { to: '/rfid/trazabilidad', label: 'Trazabilidad' },
  { to: '/rfid/lecturas', label: 'Lecturas en vivo' },
];

export function RfidModule() {
  const { session, signOut } = useAuth();

  return (
    <AppShell
      moduleName="Supervisión RFID"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.name, role: 'Supervisor CEDIS' }}
      onLogout={signOut}
    >
      <Routes>
        {/* Routes are relative to /rfid because the shell mounts this module
            at "/rfid/*". So "/" here means "/rfid", "pedidos" means
            "/rfid/pedidos", etc. */}
        <Route path="/" element={<FlujoCEDIS />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="pedidos/:paletId" element={<DetallePalet />} />
        <Route path="trazabilidad" element={<Trazabilidad />} />
        <Route path="trazabilidad/:epc" element={<Trazabilidad />} />
        <Route path="lecturas" element={<LecturasLive />} />
        <Route path="*" element={<Navigate to="/rfid" replace />} />
      </Routes>
    </AppShell>
  );
}
