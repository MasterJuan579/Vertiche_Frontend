import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, useAuth } from '@vertiche/design-system';
import { BahiaList } from './pages/BahiaList.jsx';
import { StationScreen } from './pages/StationScreen.jsx';
import { SorterOverview } from './pages/SorterOverview.jsx';

const ACCENT = '#7C3AED';

const NAV = [
  { to: '/sorter', label: 'Sorter', end: true },
  { to: '/sorter/bahias', label: 'Bahías' },
];

export function SorterModule() {
  const { session, signOut } = useAuth();

  return (
    <AppShell
      moduleName="Sorter & Bahía"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.name, role: 'Operador de Bahía' }}
      onLogout={signOut}
    >
      <Routes>
        <Route path="/" element={<SorterOverview />} />
        <Route path="bahias" element={<BahiaList />} />
        <Route path="bahias/:bahiaId" element={<StationScreen />} />
        <Route path="*" element={<Navigate to="/sorter" replace />} />
      </Routes>
    </AppShell>
  );
}
