import {
  CumplimientoCard,
  EstadoOperativoCard,
  StagesGrid,
  ThroughputChart,
} from '../components/dashboard';
import { Skeleton } from '../components/common';
import useDashboardStore from '../stores/dashboardStore';
import styles from '../styles/global.module.css';

export function Overview() {
  const loading = useDashboardStore((state) => state.loading);
  const error = useDashboardStore((state) => state.error);
  const openModal = useDashboardStore((state) => state.openModal);

  return (
    <main className={styles.page}>
      {loading && <Skeleton height={80} />}
      {error && <div className={styles.errorBanner}>API no disponible: {error}</div>}
      <div className={styles.topRow}>
        <CumplimientoCard />
        <EstadoOperativoCard />
      </div>
      <ThroughputChart />
      <StagesGrid onStageClick={openModal} />
    </main>
  );
}
