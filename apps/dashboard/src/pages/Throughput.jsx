import { KPIValue } from '../components/common';
import { ThroughputChart } from '../components/dashboard';
import useDashboardStore from '../stores/dashboardStore';
import { getThroughputBuckets } from '../utils/calculations';

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
    <main className="max-w-[1400px] mx-auto p-6 md:p-4">
      <div className="mb-[18px]">
        <span className="text-ink-400 dark:text-ink-300 text-[11px] font-bold tracking-industrial uppercase block">
          Productividad
        </span>
        <h1 className="font-display text-ink-700 dark:text-ink-100 text-[28px] font-bold mt-1">
          Throughput de hoy
        </h1>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4 md:grid-cols-1">
        <KPIValue label="Total hoy" value={total || '--'} unit="lecturas" />
        <KPIValue label="Hora pico" value={peak.hora} unit={peak.lecturas ? String(peak.lecturas) + ' lecturas' : '--'} />
        <KPIValue label="Promedio/hora" value={avg} />
        <KPIValue label="Buckets" value={buckets.length || '--'} />
      </div>
      <ThroughputChart />
    </main>
  );
}
