import { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, ensureRole, logout } from '@vertiche/design-system';
import { Overview } from './pages/Overview.jsx';
import { Throughput } from './pages/Throughput.jsx';
import { Anomalias } from './pages/Anomalias.jsx';

const ACCENT = '#0F766E';

const NAV = [
  { to: '/', label: 'Overview', end: true },
  { to: '/throughput', label: 'Productividad' },
  { to: '/anomalias', label: 'Anomalías' },
];

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const result = ensureRole('OPS_MANAGER');
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
      moduleName="Dashboard"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.name, role: 'Gerente Operativo' }}
      onLogout={logout}
    >
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/throughput" element={<Throughput />} />
        <Route path="/anomalias" element={<Anomalias />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
