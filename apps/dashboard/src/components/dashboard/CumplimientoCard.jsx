import useDashboardStore from '../../stores/dashboardStore';
import { getCumplimiento } from '../../utils/calculations';
import { formatNumber, formatPercent } from '../../utils/formatters';
import { ProgressBar } from '../common';
import styles from '../../styles/cards.module.css';

export function CumplimientoCard() {
  const pedidos = useDashboardStore((state) => state.pedidos);
  const cumplimiento = getCumplimiento(pedidos);

  return (
    <section className={styles.heroCard}>
      <span className={styles.cardLabel}>Cumplimiento</span>
      <div className={styles.bigMetric}>{formatPercent(cumplimiento.porcentaje)}</div>
      <p className={styles.cardText}>
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

