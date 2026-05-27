import { formatNumber } from '../../utils/formatters';
import styles from '../../styles/common.module.css';

export function KPIValue({ label, value, unit, status }) {
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <div className={styles.kpiLine}>
        <span className={status ? `${styles.kpiValue} ${styles[status]}` : styles.kpiValue}>
          {typeof value === 'number' ? formatNumber(value) : value}
        </span>
        {unit && <span className={styles.kpiUnit}>{unit}</span>}
      </div>
    </div>
  );
}

