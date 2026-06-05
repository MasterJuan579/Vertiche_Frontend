import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NivelBadge } from '../components/NivelBadge.jsx';
import { Stars } from '../components/Stars.jsx';
import { fetchProveedores, fetchTurnoResumen } from '../api/proveedores.js';

/**
 * Shift summary for the QA inspector. Shows daily KPIs and a list of all
 * suppliers ranked by reputation. Clicking a row navigates to that supplier's
 * detail page.
 *
 * The stats are kept local for now — when the backend is wired, these come
 * from /api/qa/turno or similar. The "Entregas hoy" KPI starts at 0 and would
 * be incremented elsewhere (OperatorScreen calls a callback).
 */

const KPI_COLOR_CLS = {
  default: 'text-ink-700 dark:text-ink-100',
  gold:    'text-amber-500 dark:text-amber-400',
  red:     'text-anomaly dark:text-anomaly-ring',
  green:   'text-flow dark:text-flow-ring',
};

export function ResumenTurno() {
  const navigate = useNavigate();
  const [stats, setStats]         = useState({ totalSO: 0, inspected: 0, rejected: 0 });
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([fetchTurnoResumen(), fetchProveedores()])
      .then(([turno, lista]) => {
        setStats(turno);
        setSuppliers(lista);
      })
      .catch((err) => console.error('Error al cargar resumen de turno:', err))
      .finally(() => setLoading(false));
  }, []);

  const active = suppliers.filter((s) => s.stars > 0);
  const avgStars = active.length
    ? (active.reduce((a, s) => a + s.stars, 0) / active.length).toFixed(1)
    : '0.0';

  const kpis = [
    { label: 'Entregas hoy',          value: stats.totalSO,   sub: `${suppliers.length} proveedores activos`, color: 'default' },
    { label: 'Cajas inspeccionadas',  value: stats.inspected, sub: 'Turno actual',          color: 'gold' },
    { label: 'Rechazos críticos',     value: stats.rejected,  sub: 'Penalización aplicada', color: 'red' },
    { label: 'Calificación promedio', value: avgStars,        sub: 'KPI global de calidad', color: 'green' },
  ];

  return (
    <div className="px-8 py-5 max-w-[1400px] mx-auto">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600"
          >
            <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-1.5">
              {k.label}
            </div>
            <div className={'font-mono text-kpi-md font-semibold leading-none mb-1 ' + (KPI_COLOR_CLS[k.color] || KPI_COLOR_CLS.default)}>
              {k.value}
            </div>
            <div className="text-[11px] text-ink-400">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Reputation list */}
      <div className="bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600">
        <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-3">
          Dashboard de reputación dinámica
        </div>

        {loading && (
          <div className="text-center py-6 text-xs text-ink-400">Cargando proveedores…</div>
        )}
        {!loading && suppliers.length === 0 && (
          <div className="text-center py-6 text-xs text-ink-400">Sin proveedores registrados.</div>
        )}
        {!loading && suppliers.map((s, idx) => {
          const barColorCls =
            s.stars >= 4.5
              ? 'bg-flow-ring'
              : s.stars >= 3.5
              ? 'bg-attention-ring'
              : s.stars > 0
              ? 'bg-anomaly-ring'
              : 'bg-ink-200 dark:bg-ink-600';
          const isLast = idx === suppliers.length - 1;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => navigate(`/proveedores/${s.id}`)}
              className={
                'w-full flex items-center justify-between py-2.5 text-left ' +
                'hover:bg-ink-50 dark:hover:bg-ink-600 transition-colors ' +
                (isLast ? '' : 'border-b border-ink-100 dark:border-ink-600')
              }
            >
              {/* Name + origin */}
              <div className="flex-1 min-w-0 px-1">
                <div className="text-[13px] font-medium text-ink-700 dark:text-ink-100 mb-0.5">
                  {s.nombre}
                </div>
                <div className="text-[11px] text-ink-400">{s.origin}</div>
              </div>

              {/* Level pill */}
              <div className="mx-4">
                <NivelBadge level={s.level} color={s.color} />
              </div>

              {/* Progress bar */}
              <div className="w-40 mx-4">
                <div className="h-1.5 bg-ink-100 dark:bg-ink-600 rounded-full overflow-hidden">
                  <div
                    className={'h-full rounded-full transition-all duration-500 ' + barColorCls}
                    style={{ width: `${(s.stars / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Rating + stars */}
              <div className="flex flex-col items-end gap-1 min-w-[68px] px-1">
                <span className="font-mono text-lg font-semibold text-ink-700 dark:text-ink-100">
                  {s.stars.toFixed(1)}
                </span>
                <Stars rating={s.stars} size={10} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
