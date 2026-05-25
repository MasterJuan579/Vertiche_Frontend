import { NivelBadge } from '../components/NivelBadge.jsx';
import { Stars } from '../components/Stars.jsx';
import { accionSistema, SUPPLIERS_INITIAL } from '../data/demoData.js';

const ACTION_TEXT_CLS = {
  elite: 'text-flow dark:text-flow-ring',
  media: 'text-attention dark:text-attention-ring',
  baja:  'text-anomaly dark:text-anomaly-ring',
  nuevo: 'text-rfid dark:text-blue-300',
};

function samplePct(stars) {
  if (stars >= 4.5) return '1%';
  if (stars >= 2.5) return '5%';
  if (stars > 0) return '15%';
  return '10%';
}

export function PlanQA() {
  const suppliers = SUPPLIERS_INITIAL;

  return (
    <div className="px-8 py-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-display text-base font-semibold text-ink-700 dark:text-ink-100">
            Plan de muestreo — Reputación en Tiempo Real
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5">
            Actualización dinámica por inspección
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-ink-100 rounded-card overflow-hidden shadow-card dark:bg-ink-700 dark:border-ink-600">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Proveedor', 'Rating', 'Criterio Muestreo', 'Acción Sistema'].map((h) => (
                <th
                  key={h}
                  className={
                    'text-[10px] font-display font-medium uppercase tracking-industrial ' +
                    'text-ink-400 text-left px-2.5 py-2 border-b border-ink-100 ' +
                    'dark:border-ink-600'
                  }
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => {
              const acc = accionSistema(s.stars);
              const pct = samplePct(s.stars);
              return (
                <tr
                  key={s.id}
                  className="hover:bg-ink-50 dark:hover:bg-ink-600 transition-colors"
                >
                  {/* Supplier name + origin */}
                  <td className="px-2.5 py-2.5 border-b border-ink-100 dark:border-ink-600">
                    <div className="text-[13px] font-medium text-ink-700 dark:text-ink-100">
                      {s.name}
                    </div>
                    <div className="text-[11px] text-ink-400">{s.origin}</div>
                  </td>

                  {/* Rating */}
                  <td className="px-2.5 py-2.5 border-b border-ink-100 dark:border-ink-600">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-lg font-semibold text-amber-500 dark:text-amber-400">
                        {s.stars.toFixed(1)}
                      </span>
                      <Stars rating={s.stars} size={11} />
                      <NivelBadge level={s.level} color={s.color} />
                    </div>
                  </td>

                  {/* Sampling criterion */}
                  <td className="px-2.5 py-2.5 border-b border-ink-100 text-xs text-ink-500 dark:border-ink-600 dark:text-ink-300">
                    {pct} de la carga
                  </td>

                  {/* System action */}
                  <td className="px-2.5 py-2.5 border-b border-ink-100 dark:border-ink-600">
                    <span className={'text-xs font-semibold ' + (ACTION_TEXT_CLS[acc.cls] || ACTION_TEXT_CLS.nuevo)}>
                      {acc.label}
                    </span>
                    <div className="text-[10px] text-ink-400 mt-0.5">{acc.hint}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
