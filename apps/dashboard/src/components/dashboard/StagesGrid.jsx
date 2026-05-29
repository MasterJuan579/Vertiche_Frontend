import useDashboardStore from '../../stores/dashboardStore';
import { getStageStats } from '../../utils/calculations';
import { StageCard } from './StageCard';

export function StagesGrid({ onStageClick }) {
  const data = useDashboardStore((state) => ({
    tags: state.tags,
    palets: state.palets,
    pedidos: state.pedidos,
    inspecciones: state.inspecciones,
    anomalias: state.anomalias,
    eventos: state.eventos,
    cajas: state.cajas,
    tiendas: state.tiendas,
    proveedores: state.proveedores,
  }));
  const stages = getStageStats(data);

  return (
    <section className="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 rounded-card mt-4 p-4">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-ink-400 dark:text-ink-300 text-[11px] font-extrabold tracking-industrial uppercase">Flujo operativo</span>
        <strong className="text-ink-700 dark:text-ink-100 text-[13px] font-bold">7 etapas RFID</strong>
      </div>
      <div className="grid grid-cols-7 gap-3 lg:grid-cols-3 md:grid-cols-1">
        {stages.map((stage) => (
          <StageCard key={stage.key} stage={stage} onClick={onStageClick} />
        ))}
      </div>
    </section>
  );
}
