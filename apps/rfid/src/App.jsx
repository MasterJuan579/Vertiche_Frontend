import { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, ensureRole, logout } from '@vertiche/design-system';
import { FlujoCEDIS } from './pages/FlujoCEDIS.jsx';
import { Pedidos } from './pages/Pedidos.jsx';
import { DetallePalet } from './pages/DetallePalet.jsx';
import { Trazabilidad } from './pages/Trazabilidad.jsx';
import { LecturasLive } from './pages/LecturasLive.jsx';

const ACCENT = '#1E40AF';

const NAV = [
  { to: '/', label: 'Flujo CEDIS', end: true },
  { to: '/pedidos', label: 'Pedidos & Palets' },
  { to: '/trazabilidad', label: 'Trazabilidad' },
  { to: '/lecturas', label: 'Lecturas en vivo' },
];

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const result = ensureRole('SUPERVISOR');
    if (result) setSession(result);
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="text-ink-400 text-sm">Verificando sesión...</div>
      </div>
    );
  }

  return (
    <AppShell
      moduleName="Supervisión RFID"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.name, role: 'Supervisor CEDIS' }}
      onLogout={logout}
    >
      <Routes>
        <Route path="/" element={<FlujoCEDIS />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/pedidos/:paletId" element={<DetallePalet />} />
        <Route path="/trazabilidad" element={<Trazabilidad />} />
        <Route path="/trazabilidad/:epc" element={<Trazabilidad />} />
        <Route path="/lecturas" element={<LecturasLive />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
