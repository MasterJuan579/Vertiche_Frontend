import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '@vertiche/design-system';
import { BAY_COLORS, BAY_COUNT } from '../data/demoData.js';
import { listTiendas } from '../api/tiendas.js';
import { listTags } from '../api/tags.js';

/**
 * Bay directory for the sorter module. Backend-driven, consistent with BayScreen:
 *   GET /rfid/bahia/tiendas → stores grouped by their assigned bay.
 *   GET /Tag/listarTags       → prepacks; counted per bay via tag.tienda_id.
 * Bays are derived from the data, not hardcoded.
 */

// "BAHIA-2" / "Bahia 2" -> 2, clamped to the configured sorter bays.
function parseBahia(s) {
  if (!s) return null;
  const m = String(s).match(/(\d+)\s*$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1 && n <= BAY_COUNT ? n : null;
}

export function BahiasList() {
  const navigate = useNavigate();

  const [tiendasAll, setTiendasAll] = useState([]);
  const [tagsAll, setTagsAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([listTiendas(), listTags()])
      .then(([t, tg]) => {
        if (cancelled) return;
        setTiendasAll(Array.isArray(t) ? t : []);
        setTagsAll(Array.isArray(tg) ? tg : []);
      })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const bahias = useMemo(() => {
    // tienda_id -> bay number, and stores grouped by bay.
    const bayByTienda = new Map();
    const storesByBay = new Map();
    for (const t of tiendasAll) {
      const n = parseBahia(t.bahia_asignada);
      if (n == null) continue;
      bayByTienda.set(t.tienda_id, n);
      if (!storesByBay.has(n)) storesByBay.set(n, []);
      storesByBay.get(n).push(t);
    }

    // Count prepacks per bay via each tag's destination tienda.
    const prepackCountByBay = new Map();
    for (const tag of tagsAll) {
      const n = bayByTienda.get(tag.tienda_id);
      if (n == null) continue;
      prepackCountByBay.set(n, (prepackCountByBay.get(n) || 0) + 1);
    }

    // A bay shows if it has stores or prepacks in the data.
    const bayNumbers = new Set([...storesByBay.keys(), ...prepackCountByBay.keys()]);
    return [...bayNumbers]
      .sort((a, b) => a - b)
      .map((numero) => {
        const stores = storesByBay.get(numero) || [];
        const destinos = [...new Set(stores.map((s) => s.ciudad).filter(Boolean))];
        return {
          id: numero,
          numero,
          color: BAY_COLORS[numero] || '#1e293b',
          destinos,
          tiendasCount: stores.length,
          prepacksCount: prepackCountByBay.get(numero) || 0,
        };
      });
  }, [tiendasAll, tagsAll]);

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-display font-bold text-ink-700 dark:text-white">
          Bahías del CEDIS
        </h1>
        <p className="text-sm text-ink-400 dark:text-ink-300 mt-1">
          {bahias.length} bahía{bahias.length !== 1 ? 's' : ''} activa{bahias.length !== 1 ? 's' : ''} · selecciona una para ver sus estaciones y prepacks asignados
          {loading && ' · cargando…'}
        </p>
      </div>

      {/* Error banner — same wording style as BayScreen */}
      {error && (
        <div className="px-4 py-2 rounded-card border border-anomaly-ring/40 bg-anomaly-bg text-anomaly text-[12px] dark:bg-anomaly/20 dark:text-anomaly-ring">
          No se pudo conectar al backend{error.status ? ` (HTTP ${error.status})` : ''}: {error.message}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && bahias.length === 0 && (
        <p className="text-sm text-ink-400 dark:text-ink-300">
          No hay bahías con tiendas o prepacks asignados.
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bahias.map((bahia) => (
          <Card
            key={bahia.id}
            onClick={() => navigate(`/sorter/bahia/${bahia.id}`)}
            className="hover:border-ink-200 dark:hover:border-ink-600 transition-all"
          >
            <CardBody className="flex flex-col h-full justify-between">
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-display font-bold text-lg"
                  style={{ backgroundColor: bahia.color }}
                >
                  {bahia.numero}
                </div>
                <span className="label-industrial text-ink-400 dark:text-ink-300">
                  Bahía {bahia.numero}
                </span>
              </div>

              <div className="mt-6">
                <span className="label-industrial text-ink-400 dark:text-ink-300 block mb-1">Destinos</span>
                <h3 className="font-display font-semibold text-ink-700 dark:text-white text-base truncate">
                  {bahia.destinos?.join(' · ') || 'Sin destinos'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 border-t border-ink-50 dark:border-ink-700/50 pt-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-300 block">Tiendas</span>
                  <span className="text-lg font-bold tabular text-ink-700 dark:text-white">{bahia.tiendasCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-300 block">Prepacks</span>
                  <span className="text-lg font-bold tabular" style={{ color: bahia.color }}>
                    {bahia.prepacksCount || 0}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
