import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import useDashboardStore from '../../stores/dashboardStore';
import { getThroughputBuckets } from '../../utils/calculations';
import styles from '../../styles/chart.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export function ThroughputChart() {
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
      tooltip: { displayColors: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  return (
    <section className={styles.chartPanel}>
      <div className={styles.chartHeader}>
        <span>Throughput</span>
        <strong>{buckets.length > 0 ? `${buckets.length} buckets` : '--'}</strong>
      </div>
      <div className={styles.chartBox}>
        {buckets.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className={styles.emptyChart}>--</div>
        )}
      </div>
    </section>
  );
}

