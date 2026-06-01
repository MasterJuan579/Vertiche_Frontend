import { ThemeToggle } from '@vertiche/design-system';
import useDashboardStore from '../../stores/dashboardStore';
import { formatDateTime } from '../../utils/formatters';

export function Topbar({ onRefresh, refreshing }) {
  const loading = useDashboardStore((state) => state.loading);
  const lastUpdate = useDashboardStore((state) => state.lastUpdate);
  const error = useDashboardStore((state) => state.error);
  const openDrawer = useDashboardStore((state) => state.openDrawer);
  const alertCount = useDashboardStore((state) => state.getAnomaliasActivas().length);
  const statusLabel = error
    ? `Error API: ${error}`
    : loading && !lastUpdate
      ? 'Cargando datos...'
      : refreshing
      ? 'Sincronizando datos...'
      : `Actualizado ${formatDateTime(lastUpdate)}`;

  return (
    <div className="flex items-center justify-between gap-4 bg-white dark:bg-ink-700 border-b border-ink-100 dark:border-ink-600 px-6 py-[18px]">
      <div>
        <div className="text-ink-400 dark:text-ink-300 text-[11px] font-bold tracking-industrial uppercase">
          Operación en vivo
        </div>
        <h1 className="font-display text-ink-700 dark:text-ink-100 text-2xl font-bold mt-0.5">
          Dashboard CEDI Lerma
        </h1>
      </div>
      <div className="flex items-center flex-wrap gap-2.5 justify-end">
        <div
          className={`inline-flex items-center gap-2 rounded-pill text-xs px-2.5 py-[7px] ${
            error ? 'bg-attention-bg text-ink-900' : 'bg-flow-bg text-flow-DEFAULT'
          }`}
        >
          <span className="rounded-pill h-2 w-2 bg-flow-ring" />
          {statusLabel}
        </div>
        <button
          className="relative inline-flex items-center justify-center w-[38px] min-h-[36px] border border-ink-200 dark:border-ink-500 rounded-md font-bold"
          type="button"
          onClick={openDrawer}
          aria-label="Abrir alertas"
        >
          !
          {alertCount > 0 && (
            <span className="absolute -top-[5px] -right-[5px] min-w-[16px] h-4 rounded-pill bg-anomaly text-white text-[10px] text-center leading-4">
              {alertCount}
            </span>
          )}
        </button>
        <ThemeToggle />
        <button
          className="inline-flex items-center min-h-[36px] px-3 rounded-md font-bold bg-dashboard border border-dashboard text-white disabled:opacity-70"
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Actualizando' : 'Actualizar'}
        </button>
      </div>
    </div>
  );
}
