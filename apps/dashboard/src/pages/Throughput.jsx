import { KPIValue } from '../components/common';
import { ThroughputChart } from '../components/dashboard';
import useDashboardStore from '../stores/dashboardStore';
import { getThroughputBuckets } from '../utils/calculations';
import styles from '../styles/global.module.css';

export function Throughput() {
  const eventos = useDashboardStore((state) => state.eventos);
  const buckets = getThroughputBuckets(eventos);
  const total = buckets.reduce((sum, item) => sum + item.lecturas, 0);
  const peak = buckets.reduce((best, item) => (item.lecturas > best.lecturas ? item : best), {
    hora: '--',
    lecturas: 0,
  });
  const avg = buckets.length > 0 ? Math.round(total / buckets.length) : '--';

  return (
    <main className={styles.page}>
      <div className={styles.sectionHead}>
        <span>Productividad</span>
        <h1>Throughput de hoy</h1>
      </div>
      <div className={styles.metricGrid}>
        <KPIValue label="Total hoy" value={total || '--'} unit="lecturas" />
        <KPIValue label="Hora pico" value={peak.hora} unit={peak.lecturas ? String(peak.lecturas) + ' lecturas' : '--'} />
        <KPIValue label="Promedio/hora" value={avg} />
        <KPIValue label="Buckets" value={buckets.length || '--'} />
      </div>
      <ThroughputChart />
    </main>
  );
}
