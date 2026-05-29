import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '@vertiche/design-system';
import useDashboardStore from '../../stores/dashboardStore';
import { getThroughputBuckets } from '../../utils/calculations';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export function ThroughputChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const eventos = useDashboardStore((state) => state.eventos);
  const buckets = getThroughputBuckets(eventos);

  const data = {
    labels: buckets.map((item) => item.hora),
    datasets: [
      {
        label: 'Lecturas',
        data: buckets.map((item) => item.lecturas),
        backgroundColor: '#0f766e',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        backgroundColor: isDark ? '#161B23' : '#ffffff',
        titleColor: isDark ? '#F5F7FA' : '#161B23',
        bodyColor: isDark ? '#F5F7FA' : '#161B23',
        borderColor: isDark ? '#3A4452' : '#E5EAF0',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDark ? '#9AA5B5' : '#5C6878' },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: isDark ? '#9AA5B5' : '#5C6878' },
        grid: { color: isDark ? '#252D38' : '#E5EAF0' },
      },
    },
  };

  return (
    <section className="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 rounded-card p-4">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-ink-400 dark:text-ink-300 text-[11px] font-extrabold tracking-industrial uppercase">
          Throughput
        </span>
        <strong className="text-ink-700 dark:text-ink-100 text-[13px] font-bold">
          {buckets.length > 0 ? `${buckets.length} buckets` : '--'}
        </strong>
      </div>
      <div className="h-[280px]">
        {buckets.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full bg-ink-50 dark:bg-ink-600 text-ink-300 dark:text-ink-400">
            --
          </div>
        )}
      </div>
    </section>
  );
}
