import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell, useAuth } from '@vertiche/design-system';
import { OperatorScreen } from './pages/OperatorScreen.jsx';
import { ResumenTurno } from './pages/ResumenTurno.jsx';
import { PlanQA } from './pages/PlanQA.jsx';
import { PerfilProveedor } from './pages/PerfilProveedor.jsx';

const ACCENT = '#C2410C';

// Nav items use absolute paths so NavLink active highlighting compares
// against the real URL. The shell mounts this module at /proveedores/*.
const NAV = [
  { to: '/proveedores',         label: 'Inspección',       end: true },
  { to: '/proveedores/resumen', label: 'Resumen turno' },
  { to: '/proveedores/plan',    label: 'Plan QA' },
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
        {/* Default landing — the QA inspector's daily inspection workflow */}
        <Route path="/" element={<OperatorScreen />} />

        {/* Secondary views */}
        <Route path="resumen" element={<ResumenTurno />} />
        <Route path="plan" element={<PlanQA />} />

        {/* Supplier detail by ID. Numeric param; the page itself redirects
            to /proveedores/resumen if the ID isn't valid. */}
        <Route path=":proveedorId" element={<PerfilProveedor />} />

        {/* Anything else bounces to the default inspection screen */}
        <Route path="*" element={<Navigate to="/proveedores" replace />} />
      </Routes>
    </AppShell>
  );
}
