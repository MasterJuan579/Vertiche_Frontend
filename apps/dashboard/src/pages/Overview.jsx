import {
  CumplimientoCard,
  EstadoOperativoCard,
  StagesGrid,
  ThroughputChart,
} from '../components/dashboard';
import { Skeleton } from '../components/common';
import useDashboardStore from '../stores/dashboardStore';

export function Overview() {
  const loading = useDashboardStore((state) => state.loading);
  const error = useDashboardStore((state) => state.error);
  const openModal = useDashboardStore((state) => state.openModal);

  return (
    <main className="max-w-[1400px] mx-auto p-6 md:p-4">
      {loading && <Skeleton height={80} />}
      {error && (
        <div className="mb-4 p-3 px-3.5 rounded-lg text-[13px] bg-attention-bg border border-attention-ring text-ink-900">
          API no disponible: {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-4 md:grid-cols-1">
        <CumplimientoCard />
        <EstadoOperativoCard />
      </div>
      <ThroughputChart />
      <StagesGrid onStageClick={openModal} />
    </main>
  );
}
