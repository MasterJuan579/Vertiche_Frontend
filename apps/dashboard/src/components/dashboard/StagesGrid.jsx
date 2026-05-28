import useDashboardStore from '../../stores/dashboardStore';
import { getStageStats } from '../../utils/calculations';
import { StageCard } from './StageCard';
import styles from '../../styles/stages.module.css';

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
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <span>Flujo operativo</span>
        <strong>7 etapas RFID</strong>
      </div>
      <div className={styles.grid}>
        {stages.map((stage) => (
          <StageCard key={stage.key} stage={stage} onClick={onStageClick} />
        ))}
      </div>
    </section>
  );
}

