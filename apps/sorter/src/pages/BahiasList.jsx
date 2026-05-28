import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BAY_COLORS } from '../data/demoData.js';
import { listTiendas } from '../api/tiendas.js';
import { listTags } from '../api/tags.js';

/**
 * Bay directory — 10 tiles in a responsive grid. Each tile shows the bay
 * number (in its accent color), how many stores feed that bay, and how many
 * prepacks are currently assigned. Click → /sorter/bahia/:id.
 *
 * Stores come from GET /Tienda/listarTiendas (grouped by bahia_asignada).
 * Prepack counts come from GET /Tag/listarTags (each tag's embedded tienda
 * resolves the bay). Both run in parallel on mount.
 */

const BAY_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function parseBahia(s) {
  if (!s) return null;
  const m = String(s).match(/(\d+)\s*$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1 && n <= 10 ? n : null;
}

export function BahiasList() {
  const navigate = useNavigate();
  const [tiendas, setTiendas] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([listTiendas(), listTags()])
      .then(([t, tg]) => {
        if (cancelled) return;
        setTiendas(Array.isArray(t) ? t : []);
        setTags(Array.isArray(tg) ? tg : []);
      })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const storesByBay = {};
  for (const t of tiendas) {
    const b = parseBahia(t.bahia_asignada);
    if (!b) continue;
    if (!storesByBay[b]) storesByBay[b] = [];
    storesByBay[b].push(t);
  }
  const prepackCountByBay = {};
  for (const tg of tags) {
    const b = parseBahia(tg.tienda?.bahia_asignada);
    if (!b) continue;
    prepackCountByBay[b] = (prepackCountByBay[b] || 0) + 1;
  }

  const isEmpty = !loading && !error && tiendas.length === 0 && tags.length === 0;

  return (
    <div className="px-8 py-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-base font-semibold text-ink-700 dark:text-ink-100">
            Bahías del CEDIS
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5">
            10 bahías activas · selecciona una para ver sus estaciones y prepacks asignados
          </div>
        </div>
        {loading && (
          <span className="font-mono text-[10px] uppercase tracking-industrial text-ink-400 shrink-0 pt-1">
            Cargando…
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-3 p-3 rounded-card border border-anomaly-ring/40 bg-anomaly-bg text-anomaly text-[12px] dark:bg-anomaly/20 dark:text-anomaly-ring dark:border-anomaly-ring/50">
          No se pudo conectar al backend{error.status ? ` (HTTP ${error.status})` : ''}: {error.message}
        </div>
      )}

      {/* Empty-data banner */}
      {isEmpty && (
        <div className="mb-3 p-3 rounded-card border border-ink-100 bg-ink-50 text-ink-500 text-[12px] dark:bg-ink-600 dark:border-ink-500 dark:text-ink-300">
          Sin datos disponibles. Las bahías aparecen vacías porque la base aún no tiene tiendas ni tags registrados.
        </div>
      )}

      {/* Tile grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {BAY_IDS.map((bayId) => {
          const color = BAY_COLORS[bayId];
          const stores = storesByBay[bayId] || [];
          const prepacks = prepackCountByBay[bayId] || 0;
          const cities = [...new Set(stores.map((s) => s.ciudad).filter(Boolean))];

          return (
            <button
              key={bayId}
              type="button"
              onClick={() => navigate(`/sorter/bahia/${bayId}`)}
              className={
                'group relative flex flex-col p-4 text-left rounded-card border ' +
                'bg-white border-ink-100 shadow-card transition-all ' +
                'hover:shadow-card-hover hover:-translate-y-0.5 ' +
                'dark:bg-ink-700 dark:border-ink-600 dark:hover:border-ink-500'
              }
              style={{ borderLeftWidth: '4px', borderLeftColor: color }}
            >
              {/* Bay number badge */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-card flex items-center justify-center font-mono text-xl font-bold text-white shadow-card"
                  style={{ background: color }}
                >
                  {bayId}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-industrial text-ink-400">
                  Bahía {bayId}
                </span>
              </div>

              {/* Cities */}
              <div className="flex-1 mb-3 min-h-[2.5rem]">
                <div className="font-mono text-[9px] uppercase tracking-industrial text-ink-400 mb-1">
                  Destinos
                </div>
                <div className="text-[12px] font-medium text-ink-700 dark:text-ink-100 leading-snug">
                  {cities.length > 0 ? cities.join(' · ') : '—'}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-ink-100 dark:border-ink-600">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-industrial text-ink-400">
                    Tiendas
                  </div>
                  <div className="font-mono text-base font-semibold text-ink-700 dark:text-ink-100">
                    {stores.length}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-industrial text-ink-400">
                    Prepacks
                  </div>
                  <div
                    className="font-mono text-base font-semibold"
                    style={{ color }}
                  >
                    {prepacks}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
