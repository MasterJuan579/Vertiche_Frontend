import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, useAuth } from '@vertiche/design-system';
import { Usuarios } from './pages/Usuarios.jsx';

const ACCENT = '#475569'; // slate-600 — admin/system accent

// Absolute paths so NavLink active-state compares against the real URL.
// Shell mounts this module at /admin/*.
const NAV = [{ to: '/admin', label: 'Usuarios', end: true }];

export function AdminModule() {
  const { session, signOut } = useAuth();

  return (
    <AppShell
      moduleName="Admin"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.nombre, role: 'Administrador' }}
      onLogout={signOut}
    >
      <Routes>
        <Route path="/" element={<Usuarios />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AppShell>
  );
}
