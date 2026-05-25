import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  BAY_COLORS,
  getPrepacksForBay,
  getStoresByBay,
} from '../data/demoData.js';
import { PrepackDetailPanel } from '../components/PrepackDetailPanel.jsx';

/**
 * Per-bay view. Three "stations" (terminals) split the prepacks round-robin
 * so the team at each station can pull from their own queue. The right
 * sidebar shows the selected prepack's full detail.
 *
 * Default selection: first prepack of the bay if any.
 */
export function BayScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const bayId = parseInt(id, 10);

  // Guard against bad URLs.
  if (!Number.isFinite(bayId) || bayId < 1 || bayId > 10) {
    return <Navigate to="/sorter/bahias" replace />;
  }

  const bayColor = BAY_COLORS[bayId] || '#6b7280';
  const allPrepacks = getPrepacksForBay(bayId);
  const stores = (getStoresByBay()[bayId] || []);

  const [selectedEpc, setSelectedEpc] = useState(allPrepacks[0]?.epc ?? null);
  const selected = allPrepacks.find((p) => p.epc === selectedEpc) || null;

  // Round-robin into 3 stations.
  const stations = [1, 2, 3].map((termNum) => ({
    terminal: termNum,
    prepacks: allPrepacks.filter((_, i) => i % 3 === termNum - 1),
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] overflow-hidden">

      {/* ───── Bay header ───── */}
      <div className={
        'flex items-center gap-4 px-6 py-3.5 border-b border-ink-100 shrink-0 ' +
        'bg-white dark:bg-ink-700 dark:border-ink-600'
      }>
        {/* Back to list */}
        <button
          type="button"
          onClick={() => navigate('/sorter/bahias')}
          className={
            'shrink-0 px-3 py-1.5 rounded-card text-xs font-medium transition-colors ' +
            'bg-ink-50 border border-ink-100 text-ink-500 hover:bg-ink-100 ' +
            'dark:bg-ink-600 dark:border-ink-500 dark:text-ink-300 dark:hover:bg-ink-500'
          }
        >
          ← Bahías
        </button>

        {/* Bay badge */}
        <div
          className="w-11 h-11 rounded-card flex items-center justify-center font-mono text-lg font-bold text-white shrink-0 shadow-card"
          style={{ background: bayColor }}
        >
          {bayId}
        </div>

        {/* Bay title */}
        <div className="flex-1 min-w-0">
          <div className="font-display text-base font-semibold text-ink-700 dark:text-ink-100">
            Bahía {bayId}
          </div>
          <div className="font-mono text-[11px] text-ink-400 truncate">
            {allPrepacks.length} prepack{allPrepacks.length !== 1 ? 's' : ''} · {stores.length} tienda{stores.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-flow-ring animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-industrial text-flow dark:text-flow-ring">
            En vivo
          </span>
        </div>
      </div>

      {/* ───── Body: 3-station grid + right panel ───── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Stations */}
        <div className={
          'flex-1 grid grid-cols-3 gap-px overflow-hidden min-w-0 ' +
          'bg-ink-100 dark:bg-ink-600'
        }>
          {stations.map((s) => (
            <StationColumn
              key={s.terminal}
              terminal={s.terminal}
              prepacks={s.prepacks}
              bayColor={bayColor}
              selectedEpc={selectedEpc}
              onSelect={setSelectedEpc}
            />
          ))}
        </div>

        {/* Detail panel */}
        <div className="w-[360px] shrink-0 flex flex-col">
          <PrepackDetailPanel prepack={selected} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────

function StationColumn({ terminal, prepacks, bayColor, selectedEpc, onSelect }) {
  return (
    <div className={
      'flex flex-col overflow-hidden ' +
      'bg-white dark:bg-ink-700'
    }>
      {/* Station header */}
      <div className="px-4 py-3 border-b border-ink-100 dark:border-ink-600 shrink-0">
        <span
          className="font-mono text-[11px] uppercase tracking-industrial font-bold"
          style={{ color: bayColor }}
        >
          Estación {terminal}
        </span>
        <span className="ml-2 text-[10px] text-ink-400">
          · {prepacks.length} prepack{prepacks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Prepack cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {prepacks.length === 0 && (
          <p className="text-center text-[11px] text-ink-400 mt-4">
            Sin prepacks asignados
          </p>
        )}

        {prepacks.map((p) => (
          <PrepackCard
            key={p.epc}
            p={p}
            bayColor={bayColor}
            isSelected={selectedEpc === p.epc}
            onClick={() => onSelect(p.epc)}
          />
        ))}
      </div>
    </div>
  );
}

function PrepackCard({ p, bayColor, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'w-full p-2.5 rounded-card text-left transition-colors ' +
        'border ' +
        (isSelected
          ? 'bg-ink-50 dark:bg-ink-600'
          : 'bg-white hover:bg-ink-50 dark:bg-ink-700 dark:hover:bg-ink-600')
      }
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: bayColor,
        borderTopColor: isSelected ? bayColor : undefined,
        borderRightColor: isSelected ? bayColor : undefined,
        borderBottomColor: isSelected ? bayColor : undefined,
        borderTopStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[11px] font-bold"
          style={{ color: bayColor }}
        >
          ···{p.epc.slice(-4)}
        </span>
        <span className="font-mono text-[9px] text-ink-400">{p.orden_id}</span>
      </div>
      <div className="mt-1 text-[12px] font-semibold text-ink-700 dark:text-ink-100 truncate">
        {p.producto}
      </div>
      <div className="text-[10px] text-ink-400 truncate">
        {p.colores.join(' · ')} — {p.tallas.join(', ')} · {p.total_prendas}p
      </div>
      <div className="text-[10px] text-ink-400 truncate">
        {p.tienda?.nombre}
      </div>
    </button>
  );
}
