import { useEffect, useState } from 'react';
import { NivelBadge } from '../components/NivelBadge.jsx';
import { Stars } from '../components/Stars.jsx';
import { fetchProveedores } from '../api/proveedores.js';
import { SUPPLIERS_INITIAL } from '../data/demoData.js';

// Normaliza el mock al shape del backend (usa `nombre`, no `name`).
const MOCK_FALLBACK = SUPPLIERS_INITIAL.map((s) => ({ ...s, nombre: s.name }));

export function PlanQA() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProveedores()
      .then((data) => {
        if (!cancelled) {
          setSuppliers(data);
          setLoading(false);
        }
      })
      .catch(() => {
        // Backend caído / no disponible → caemos a datos demo para no bloquear la UI.
        if (!cancelled) {
          setSuppliers(MOCK_FALLBACK);
          setUsingMock(true);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

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
        {usingMock && (
          <span className={
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ' +
            'font-display text-[10px] font-semibold uppercase tracking-industrial ' +
            'bg-attention-bg text-attention border-attention-ring/40 ' +
            'dark:bg-attention/15 dark:text-attention-ring dark:border-attention-ring/50'
          }>
            <span className="w-1.5 h-1.5 rounded-full bg-attention-ring" />
            Datos demo · backend no disponible
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-ink-100 rounded-card overflow-hidden shadow-card dark:bg-ink-700 dark:border-ink-600">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Proveedor', 'Rating', 'Nivel'].map((h) => (
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
            {loading && (
              <tr>
                <td colSpan={3} className="px-2.5 py-6 text-center text-xs text-ink-400">
                  Cargando proveedores…
                </td>
              </tr>
            )}

            {!loading && suppliers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-2.5 py-6 text-center text-xs text-ink-400">
                  Sin proveedores registrados.
                </td>
              </tr>
            )}

            {!loading && suppliers.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-ink-50 dark:hover:bg-ink-600 transition-colors"
              >
                {/* Supplier name + origin */}
                <td className="px-2.5 py-2.5 border-b border-ink-100 dark:border-ink-600">
                  <div className="text-[13px] font-medium text-ink-700 dark:text-ink-100">
                    {s.nombre}
                  </div>
                  <div className="text-[11px] text-ink-400">{s.origin}</div>
                </td>

                {/* Rating */}
                <td className="px-2.5 py-2.5 border-b border-ink-100 dark:border-ink-600">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-lg font-semibold text-amber-500 dark:text-amber-400">
                      {Number(s.stars).toFixed(1)}
                    </span>
                    <Stars rating={s.stars} size={11} />
                  </div>
                </td>

                {/* Nivel */}
                <td className="px-2.5 py-2.5 border-b border-ink-100 dark:border-ink-600">
                  <NivelBadge level={s.level} color={s.color} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
