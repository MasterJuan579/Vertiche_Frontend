import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, useAuth } from '@vertiche/design-system';
import { SorterScreen } from './pages/SorterScreen.jsx';
import { BahiasList } from './pages/BahiasList.jsx';
import { BayScreen } from './pages/BayScreen.jsx';

const ACCENT = '#7C3AED';

// Absolute paths so NavLink active-state compares against the real URL.
// Shell mounts this module at /sorter/*.
const NAV = [
  { to: '/sorter',        label: 'Sorter',  end: true },
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
        {/* Default — live scanner view */}
        <Route path="/" element={<SorterScreen />} />

        {/* Bay directory */}
        <Route path="bahias" element={<BahiasList />} />

        {/* Per-bay detail. BayScreen redirects to /sorter/bahias if the ID
            is bad (non-numeric or out of range). */}
        <Route path="bahia/:id" element={<BayScreen />} />

        {/* Anything else bounces to the scanner */}
        <Route path="*" element={<Navigate to="/sorter" replace />} />
      </Routes>
    </AppShell>
  );
}
