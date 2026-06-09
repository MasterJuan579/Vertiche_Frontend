import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { BAY_COLORS, BAY_COUNT } from '../data/demoData.js';
import { listTiendas } from '../api/tiendas.js';
import { listTagsCompletos } from '../api/tags.js';
import { PrepackDetailPanel } from '../components/PrepackDetailPanel.jsx';

/**
 * Per-bay view. Each of the three physical boxes belongs to one store, using
 * Tienda.caja_asignada. The right
 * sidebar shows the selected prepack's full detail.
 *
 * Data: GET /Tag/listarTagsCompletos (each tag arrives with embedded tienda,
 * proveedor, palet and orden_compra) + GET /rfid/bahia/tiendas to know
 * every store assigned to the bay even if it has zero prepacks yet.
 */

function parseBahia(s) {
  if (!s) return null;
  const m = String(s).match(/(\d+)\s*$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1 && n <= BAY_COUNT ? n : null;
}

function enrichForPanel(tag, bayId) {
  if (!tag) return null;
  return {
    ...tag,
    bayNumber: bayId,
    proveedor: tag.proveedor?.nombre || null,
  };
}

export function BayScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const bayId = parseInt(id, 10);
  const validBay = Number.isFinite(bayId) && bayId >= 1 && bayId <= BAY_COUNT;

  const [tagsAll, setTagsAll] = useState([]);
  const [tiendasAll, setTiendasAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEpc, setSelectedEpc] = useState(null);

  useEffect(() => {
    if (!validBay) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedEpc(null);
    Promise.all([listTagsCompletos(), listTiendas()])
      .then(([tg, t]) => {
        if (cancelled) return;
        setTagsAll(Array.isArray(tg) ? tg : []);
        setTiendasAll(Array.isArray(t) ? t : []);
      })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bayId, validBay]);

  const bayColor = BAY_COLORS[bayId] || '#6b7280';
  const storeById = new Map(tiendasAll.map((store) => [store.tienda_id, store]));
  const allPrepacks = validBay
    ? tagsAll
      .map((tag) => {
        const configuredStore = storeById.get(tag.tienda_id);
        if (!configuredStore) return null;
        return {
          ...tag,
          tienda: {
            ...(tag.tienda || {}),
            ...configuredStore,
          },
        };
      })
      .filter((tag) => tag && parseBahia(tag.tienda?.bahia_asignada) === bayId)
    : [];
  const stores = validBay
    ? tiendasAll.filter((t) => parseBahia(t.bahia_asignada) === bayId)
    : [];

  // Auto-select first prepack once data lands
  useEffect(() => {
    if (!selectedEpc && allPrepacks.length > 0) {
      setSelectedEpc(allPrepacks[0].epc);
    }
  }, [allPrepacks, selectedEpc]);

  if (!validBay) {
    return <Navigate to="/sorter/bahias" replace />;
  }

  const selected = enrichForPanel(
    allPrepacks.find((p) => p.epc === selectedEpc) || null,
    bayId
  );

  // Each physical box shows only prepacks for its configured store.
  const stations = [1, 2, 3].map((termNum) => ({
    terminal: termNum,
    store: stores.find((store) => Number(store.caja_asignada) === termNum) || null,
    prepacks: allPrepacks.filter(
      (tag) => Number(tag.tienda?.caja_asignada) === termNum
    ),
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
            {loading && ' · cargando…'}
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

      {/* Error banner */}
      {error && (
        <div className="px-6 py-2 border-b border-anomaly-ring/40 bg-anomaly-bg text-anomaly text-[12px] dark:bg-anomaly/20 dark:text-anomaly-ring shrink-0">
          No se pudo conectar al backend{error.status ? ` (HTTP ${error.status})` : ''}: {error.message}
        </div>
      )}

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
              store={s.store}
              prepacks={s.prepacks}
              bayColor={bayColor}
              selectedEpc={selectedEpc}
              onSelect={setSelectedEpc}
              loading={loading}
              hasError={!!error}
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

function StationColumn({ terminal, store, prepacks, bayColor, selectedEpc, onSelect, loading, hasError }) {
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
          Caja {terminal}
        </span>
        <div className="ml-2 min-w-0">
          <div className="text-[10px] font-medium text-ink-600 dark:text-ink-200 truncate">
            {store?.nombre || 'Sin tienda asignada'}
          </div>
          <div className="text-[9px] text-ink-400">
            {prepacks.length} prepack{prepacks.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Prepack cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && prepacks.length === 0 && (
          <p className="text-center text-[11px] text-ink-400 mt-4">
            Cargando…
          </p>
        )}

        {!loading && !hasError && prepacks.length === 0 && (
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
  const titulo = p.producto || p.sku || '—';
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
        <span className="font-mono text-[9px] text-ink-400">{p.orden_id || '—'}</span>
      </div>
      <div className="mt-1 text-[12px] font-semibold text-ink-700 dark:text-ink-100 truncate">
        {titulo}
      </div>
      <div className="text-[10px] text-ink-400 truncate">
        {p.color || '—'} — {p.talla || '—'} · {p.cantidad_piezas ?? 0}p
      </div>
      <div className="text-[10px] text-ink-400 truncate">
        {p.tienda?.nombre || '—'}
      </div>
    </button>
  );
}
