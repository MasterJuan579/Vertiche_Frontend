import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell, useAuth } from '@vertiche/design-system';
import { Overview } from './pages/Overview.jsx';
import { Throughput } from './pages/Throughput.jsx';
import { Anomalias } from './pages/Anomalias.jsx';
import { AlertsDrawer } from './components/alerts';
import { Subbar, Topbar } from './components/layout';
import { ModalFooter, ModalHeader, ModalOverlay } from './components/modals';
import { Skeleton } from './components/common';
import { useDashboardData, useModal, useRealtime } from './hooks';
import useDashboardStore from './stores/dashboardStore';
import { STAGE_BY_KEY } from './utils/constants';
const ACCENT = '#0F766E';

const NAV = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/throughput', label: 'Productividad' },
  { to: '/dashboard/anomalias', label: 'Anomalías' },
];

const stageModals = {
  preregistro: lazy(() => import('./components/modals/stages/PreregistroModal')),
  qa: lazy(() => import('./components/modals/stages/QAModal')),
  registro: lazy(() => import('./components/modals/stages/RegistroModal')),
  sorter: lazy(() => import('./components/modals/stages/SorterModal')),
  bahia: lazy(() => import('./components/modals/stages/BahiaModal')),
  auditoria: lazy(() => import('./components/modals/stages/AuditoriaModal')),
  envio: lazy(() => import('./components/modals/stages/EnvioModal')),
};

export function DashboardModule() {
  const { session, signOut } = useAuth();
  const { refresh } = useDashboardData(30000);
  useRealtime((_type, _payload) => {
    // Refresca todo el dashboard ante cualquier evento en vivo.
    // En una iteración futura se puede optimizar para actualizar
    // solo la colección afectada.
    refresh();
  });
  const { modalOpen, modalKey, closeModal } = useModal();
  const refreshing = useDashboardStore((state) => state.refreshing);
  const drawerOpen = useDashboardStore((state) => state.drawerOpen);
  const closeDrawer = useDashboardStore((state) => state.closeDrawer);
  const ModalComponent = modalKey ? stageModals[modalKey] : null;
  const modalTitle = modalKey ? STAGE_BY_KEY[modalKey]?.title ?? modalKey : '';

  return (
    <AppShell
      moduleName="Dashboard"
      moduleAccent={ACCENT}
      navItems={NAV}
      user={{ name: session.user.nombre, role: 'Gerente Operativo' }}
      onLogout={signOut}
    >
      <Topbar onRefresh={refresh} refreshing={refreshing} />
      <Subbar />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="throughput" element={<Throughput />} />
        <Route path="anomalias" element={<Anomalias />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <AlertsDrawer isOpen={drawerOpen} onClose={closeDrawer} />
      <ModalOverlay isOpen={modalOpen} onClose={closeModal}>
        {ModalComponent && (
          <>
            <ModalHeader title={modalTitle} onClose={closeModal} />
            <Suspense fallback={<Skeleton height={220} />}>
              <ModalComponent />
            </Suspense>
            <ModalFooter etapa={modalKey} />
          </>
        )}
      </ModalOverlay>
    </AppShell>
  );
}
