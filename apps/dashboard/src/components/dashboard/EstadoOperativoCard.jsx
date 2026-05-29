import useDashboardStore from '../../stores/dashboardStore';
import { getEstadoOperativo } from '../../utils/calculations';
import { StatusBadge } from '../common';

export function EstadoOperativoCard() {
  const anomalias = useDashboardStore((state) => state.anomalias);
  const eventos = useDashboardStore((state) => state.eventos);
  const estado = getEstadoOperativo({ anomalias, eventos });

  const statusColor =
    estado.status === 'ok'
      ? 'bg-flow-ring'
      : estado.status === 'warning'
        ? 'bg-attention-ring'
        : estado.status === 'critical'
          ? 'bg-anomaly-ring'
          : 'bg-ink-300';

  return (
    <section className="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 rounded-card min-h-[178px] p-5">
      <span className="text-ink-400 dark:text-ink-300 text-[11px] font-extrabold tracking-industrial uppercase block">Estado operativo</span>
      <div className="flex items-center gap-3">
        <span className={`rounded-pill h-4 w-4 ${statusColor}`} />
        <div className="text-ink-700 dark:text-ink-100 font-display text-[38px] font-bold leading-[1.1] mt-3">{estado.label}</div>
      </div>
      <p className="text-ink-400 dark:text-ink-300 text-[13px] my-2 mb-4">{estado.detail}</p>
      <StatusBadge status={estado.status}>Monitoreo RFID activo</StatusBadge>
    </section>
  );
}
