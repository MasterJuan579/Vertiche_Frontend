import { useNavigate } from 'react-router-dom';
import {
  BAY_COLORS,
  getPrepackCountByBay,
  getStoresByBay,
} from '../data/demoData.js';

/**
 * Bay directory — 10 tiles in a responsive grid. Each tile shows the bay
 * number (in its accent color), how many stores feed that bay, and how many
 * prepacks are currently assigned. Click → /sorter/bahia/:id.
 *
 * The bay operator typically reaches this from the sidebar "Bahías" nav
 * item when they need to inspect a specific bay without waiting for a
 * scan event to surface it.
 */

const BAY_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function BahiasList() {
  const navigate = useNavigate();
  const prepackCount = getPrepackCountByBay();
  const storesByBay = getStoresByBay();

  return (
    <div className="px-8 py-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="mb-4">
        <div className="font-display text-base font-semibold text-ink-700 dark:text-ink-100">
          Bahías del CEDIS
        </div>
        <div className="text-[11px] text-ink-400 mt-0.5">
          10 bahías activas · selecciona una para ver sus estaciones y prepacks asignados
        </div>
      </div>

      {/* Tile grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {BAY_IDS.map((bayId) => {
          const color = BAY_COLORS[bayId];
          const stores = storesByBay[bayId] || [];
          const prepacks = prepackCount[bayId] || 0;
          const cities = [...new Set(stores.map((s) => s.ciudad))];

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
