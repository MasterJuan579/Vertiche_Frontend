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
  const errors = useDashboardStore((state) => state.errors);
  const openModal = useDashboardStore((state) => state.openModal);

  const partialErrorKeys = Object.keys(errors || {});
  const hasPartialErrors = partialErrorKeys.length > 0 && !error;

  return (
    <main className="max-w-[1400px] mx-auto p-6 md:p-4">
      {loading && <Skeleton height={80} />}
      {error && (
        <div className="mb-4 p-3 px-3.5 rounded-lg text-[13px] bg-attention-bg border border-attention-ring text-ink-900">
          API no disponible: {error}
        </div>
      )}
      {hasPartialErrors && (
        <div className="mb-4 p-3 px-3.5 rounded-lg text-[13px] bg-ink-50 dark:bg-ink-600 border border-ink-200 dark:border-ink-500 text-ink-600 dark:text-ink-200">
          Datos parciales: no se cargaron {partialErrorKeys.join(', ')}. El resto de la información está actualizada.
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
