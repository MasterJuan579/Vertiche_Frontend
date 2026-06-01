import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, useAuth } from '@vertiche/design-system';
import { SorterScreen } from './pages/SorterScreen.jsx';
import { CajaSorterScreen } from './pages/CajaSorterScreen.jsx';
import { BahiasList } from './pages/BahiasList.jsx';
import { BayScreen } from './pages/BayScreen.jsx';
import { OperatorScreen } from './pages/OperatorScreen.jsx';

const ACCENT = '#7C3AED';

// Absolute paths so NavLink active-state compares against the real URL.
// Shell mounts this module at /sorter/*.
const NAV = [
  { to: '/sorter',          label: 'Sorter -> Bahia', end: true },
  { to: '/sorter/cajas',    label: 'Arco -> Caja' },
  { to: '/sorter/bahias',   label: 'Bahias' },
  { to: '/sorter/caja/1',   label: 'Caja 1' },
  { to: '/sorter/caja/2',   label: 'Caja 2' },
  { to: '/sorter/caja/3',   label: 'Caja 3' },
];

export function SorterModule() {
  const { session, signOut } = useAuth();

  return (
    <AppShell
      moduleName="Flujo CEDIS"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.nombre, role: 'Operacion Bahia' }}
      onLogout={signOut}
    >
      <Routes>
        {/* Default — live scanner view */}
        <Route path="/" element={<SorterScreen />} />
        <Route path="cajas" element={<CajaSorterScreen />} />

        {/* Bay directory */}
        <Route path="bahias" element={<BahiasList />} />

        {/* Per-bay detail. BayScreen redirects to /sorter/bahias if the ID
            is bad (non-numeric or out of range). */}
        <Route path="bahia/:id" element={<BayScreen />} />

        {/* Per-box operator screens. Old /operador route remains as an alias. */}
        <Route path="caja/:id" element={<OperatorScreen />} />
        <Route path="operador/:id" element={<OperatorScreen />} />

        {/* Anything else bounces to the scanner */}
        <Route path="*" element={<Navigate to="/sorter" replace />} />
      </Routes>
    </AppShell>
  );
}
