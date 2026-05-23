import { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, ensureRole, logout } from '@vertiche/design-system';
import { ProveedorList } from './pages/ProveedorList.jsx';
import { ProveedorDetail } from './pages/ProveedorDetail.jsx';

const ACCENT = '#C2410C';

const NAV = [
  { to: '/', label: 'Proveedores', end: true },
];

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const result = ensureRole('QA_INSPECTOR');
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
      moduleName="Calidad Proveedores"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.name, role: 'Inspector QA' }}
      onLogout={logout}
    >
      <Routes>
        <Route path="/" element={<ProveedorList />} />
        <Route path="/:proveedorId" element={<ProveedorDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
