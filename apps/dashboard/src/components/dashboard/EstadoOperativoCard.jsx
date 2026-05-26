import useDashboardStore from '../../stores/dashboardStore';
import { getEstadoOperativo } from '../../utils/calculations';
import { StatusBadge } from '../common';
import styles from '../../styles/cards.module.css';

export function EstadoOperativoCard() {
  const anomalias = useDashboardStore((state) => state.anomalias);
  const eventos = useDashboardStore((state) => state.eventos);
  const estado = getEstadoOperativo({ anomalias, eventos });

  return (
    <section className={styles.heroCard}>
      <span className={styles.cardLabel}>Estado operativo</span>
      <div className={styles.statusLine}>
        <span className={`${styles.statusDot} ${styles[estado.status]}`} />
        <div className={styles.bigMetric}>{estado.label}</div>
      </div>
      <p className={styles.cardText}>{estado.detail}</p>
      <StatusBadge status={estado.status}>Monitoreo RFID activo</StatusBadge>
    </section>
  );
}

