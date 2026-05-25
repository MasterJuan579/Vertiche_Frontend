import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, useAuth } from '@vertiche/design-system';
import { Overview } from './pages/Overview.jsx';
import { Throughput } from './pages/Throughput.jsx';
import { Anomalias } from './pages/Anomalias.jsx';

const ACCENT = '#0F766E';

const NAV = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/throughput', label: 'Productividad' },
  { to: '/dashboard/anomalias', label: 'Anomalías' },
];

export function DashboardModule() {
  const { session, signOut } = useAuth();

  return (
    <AppShell
      moduleName="Dashboard"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.name, role: 'Gerente Operativo' }}
      onLogout={signOut}
    >
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="throughput" element={<Throughput />} />
        <Route path="anomalias" element={<Anomalias />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}
