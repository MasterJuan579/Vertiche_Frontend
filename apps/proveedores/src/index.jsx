import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, useAuth } from '@vertiche/design-system';
import { ProveedorList } from './pages/ProveedorList.jsx';
import { ProveedorDetail } from './pages/ProveedorDetail.jsx';

const ACCENT = '#C2410C';

const NAV = [
  { to: '/proveedores', label: 'Proveedores', end: true },
];

export function ProveedoresModule() {
  const { session, signOut } = useAuth();

  return (
    <AppShell
      moduleName="Calidad Proveedores"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.name, role: 'Inspector QA' }}
      onLogout={signOut}
    >
      <Routes>
        <Route path="/" element={<ProveedorList />} />
        <Route path=":proveedorId" element={<ProveedorDetail />} />
        <Route path="*" element={<Navigate to="/proveedores" replace />} />
      </Routes>
    </AppShell>
  );
}
