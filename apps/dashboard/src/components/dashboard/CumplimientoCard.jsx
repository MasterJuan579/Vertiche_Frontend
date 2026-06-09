import useDashboardStore from '../../stores/dashboardStore';
import { getCumplimiento } from '../../utils/calculations';
import { formatNumber, formatPercent } from '../../utils/formatters';
import { ProgressBar } from '../common';

export function CumplimientoCard() {
  const pedidos = useDashboardStore((state) => state.pedidos);
  const tags = useDashboardStore((state) => state.tags);
  const cumplimiento = getCumplimiento(pedidos, tags);

  return (
    <section className="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 rounded-card min-h-[178px] p-5">
      <span className="text-ink-400 dark:text-ink-300 text-[11px] font-extrabold tracking-industrial uppercase block">Cumplimiento</span>
      <div className="text-ink-700 dark:text-ink-100 font-display text-[38px] font-bold leading-[1.1] mt-3">{formatPercent(cumplimiento.porcentaje)}</div>
      <p className="text-ink-400 dark:text-ink-300 text-[13px] my-2 mb-4">
        {formatNumber(cumplimiento.totalRecibidos)} de {formatNumber(cumplimiento.totalEsperados)} unidades recibidas
      </p>
      <ProgressBar
        value={cumplimiento.totalRecibidos}
        max={cumplimiento.totalEsperados}
        color="#0f766e"
      />
    </section>
  );
}
