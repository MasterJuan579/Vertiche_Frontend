import { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, ensureRole, logout } from '@vertiche/design-system';
import { BahiaList } from './pages/BahiaList.jsx';
import { StationScreen } from './pages/StationScreen.jsx';
import { SorterOverview } from './pages/SorterOverview.jsx';

const ACCENT = '#7C3AED';

const NAV = [
  { to: '/', label: 'Sorter', end: true },
  { to: '/bahias', label: 'Bahías' },
];

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const result = ensureRole('BAY_OPERATOR');
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
      moduleName="Sorter & Bahía"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.name, role: 'Operador de Bahía' }}
      onLogout={logout}
    >
      <Routes>
        <Route path="/" element={<SorterOverview />} />
        <Route path="/bahias" element={<BahiaList />} />
        <Route path="/bahias/:bahiaId" element={<StationScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
