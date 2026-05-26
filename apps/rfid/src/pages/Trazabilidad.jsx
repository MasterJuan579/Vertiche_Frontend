import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ETAPA_LABELS,
  ETAPA_COLORS,
  getColorCSS,
  esColorClaro,
} from '../data/demoOCs.js';
import { formatHora, epcCorto } from '../utils/format.js';
import { realApi } from '../services/realApi.js';

const ETAPAS_ORDEN = ['PREREGISTRO', 'QA', 'REGISTRO', 'SORTER', 'BAHIA', 'AUDITORIA', 'ENVIO'];

export function Trazabilidad() {
  const { epc: urlEpc } = useParams();
  const navigate = useNavigate();

  const [tipoBusqueda, setTipoBusqueda] = useState('epc');
  const [busqueda, setBusqueda] = useState(urlEpc || '');
  const [resultado, setResultado] = useState(null);
  const [resultadoLista, setResultadoLista] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (urlEpc) {
      setBusqueda(urlEpc);
      setTipoBusqueda('epc');
      buscarEpc(urlEpc);
    }
  }, [urlEpc]);

  async function buscarEpc(epc) {
    setError(null);
    setResultado(null);
    setResultadoLista(null);
    setCargando(true);

    try {
      const tag = await realApi.getTagByEpc(epc);
      if (!tag) {
        setError(`No se encontró ningún prepack con EPC "${epc}".`);
        setCargando(false);
        return;
      }

      // Obtener tienda asociada
      let tienda = null;
      if (tag.tienda_id) {
        const tiendas = await realApi.getTiendas();
        tienda = tiendas.find(t => t.tienda_id === tag.tienda_id);
      }

      const tagConTienda = { ...tag, tienda };

      // Buscar OC asociada
      const ocs = await realApi.getOrdenesCompra();
      const ocOwner = ocs.find(oc => oc.ordenId === tag.orden_id);

      // Construir timeline básico
      const timeline = buildTimelineFromTag(tagConTienda);

      setResultado({ tag: tagConTienda, timeline, ocOwner });
    } catch (err) {
      setError(`Error al buscar: ${err.message}`);
    } finally {
      setCargando(false);
    }
  }

  async function buscarSku(sku) {
    setError(null);
    setResultado(null);
    setResultadoLista(null);
    setCargando(true);

    try {
      const tags = await realApi.getTags();
      const normalizedSku = sku.trim().toLowerCase();
      const matches = tags.filter(t => 
        (t.sku || '').toLowerCase().includes(normalizedSku)
      ).map(t => ({ ...t, ordenId: t.orden_id }));

      setResultadoLista(matches);
    } catch (err) {
      setError(`Error al buscar: ${err.message}`);
    } finally {
      setCargando(false);
    }
  }

  function buildTimelineFromTag(tag) {
    const events = [];
    const etapas = ['RECEPCION', 'QA', 'SORTING', 'PACKING', 'SALIDA'];
    const mapeoEtapa = {
      'RECEPCION': 'PREREGISTRO',
      'QA': 'QA',
      'SORTING': 'SORTER',
      'PACKING': 'BAHIA',
      'SALIDA': 'ENVIO'
    };

    etapas.forEach(etapa => {
      const etapaDisplay = mapeoEtapa[etapa] || etapa;
      events.push({
        tipo: 'LECTURA',
        etapa: etapaDisplay,
        detalle: etapaDisplay,
        tiempo: tag.registrado_en || new Date().toISOString(),
        lector: 'SISTEMA',
      });
    });

    return events;
  }

  function buscar(epcOverride, skuOverride) {
    const query = epcOverride || skuOverride || busqueda.trim();
    const tipo = epcOverride ? 'epc' : skuOverride ? 'sku' : tipoBusqueda;
    if (!query) return;

    if (tipo === 'epc') {
      buscarEpc(query);
      navigate(`/rfid/trazabilidad/${query}`, { replace: true });
    } else {
      buscarSku(query);
    }
  }

  const verDetalle = (epc) => {
    setBusqueda(epc);
    setTipoBusqueda('epc');
    buscarEpc(epc);
    navigate(`/rfid/trazabilidad/${epc}`, { replace: true });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">

      {/* LEFT COLUMN */}
      <div className="space-y-4">
        <Panel title="Buscar Prepack">
          <div className="p-4 space-y-2.5">
            <div className="flex rounded-card overflow-hidden border border-ink-100 dark:border-ink-500">
              {['epc', 'sku'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoBusqueda(t)}
                  className={`flex-1 py-1.5 text-[12px] font-medium uppercase tracking-[0.04em] transition-colors ${
                    tipoBusqueda === t
                      ? 'bg-rfid text-white'
                      : 'bg-white text-ink-500 hover:bg-ink-50 dark:bg-ink-700 dark:text-ink-300 dark:hover:bg-ink-600'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder={tipoBusqueda === 'epc' ? 'E001A o EPC-SIM-000…' : 'BLU-S, AZU-M…'}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
            />

            <button
              type="button"
              onClick={() => buscar()}
              disabled={!busqueda.trim() || cargando}
              className={`w-full py-2 rounded-card text-[13px] font-semibold transition-colors ${
                busqueda.trim() && !cargando
                  ? 'bg-rfid text-white hover:bg-blue-700'
                  : 'bg-ink-100 text-ink-400 cursor-not-allowed'
              }`}
            >
              {cargando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </Panel>

        <Panel title="Ejemplos rápidos">
          <div className="p-3 space-y-2">
            <QuickLink label="Buscar por EPC" onClick={() => { setTipoBusqueda('epc'); setBusqueda('RFID001'); buscar('RFID001'); }} />
            <QuickLink label="Buscar por SKU" onClick={() => { setTipoBusqueda('sku'); setBusqueda('PLAYERA'); buscar(null, 'PLAYERA'); }} variant="anomaly" />
          </div>
        </Panel>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-4">
        {!resultado && !resultadoLista && !error && !cargando && (
          <Panel>
            <div className="px-6 py-12 text-center">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-[13px] text-ink-400">
                Ingresa un EPC o SKU para buscar un prepack
              </div>
            </div>
          </Panel>
        )}

        {cargando && (
          <Panel>
            <div className="px-6 py-12 text-center text-ink-400">Cargando...</div>
          </Panel>
        )}

        {error && (
          <Panel error>
            <div className="px-4 py-3 text-[13px] text-anomaly dark:text-anomaly-ring">{error}</div>
          </Panel>
        )}

        {resultadoLista && resultadoLista.length > 0 && (
          <Panel title={`Coincidencias (${resultadoLista.length})`}>
            {resultadoLista.map((tag) => (
              <SkuMatchRow key={tag.epc} tag={tag} onVer={verDetalle} />
            ))}
          </Panel>
        )}

        {resultado?.tag && (
          <>
            <PrepackInfoCard tag={resultado.tag} ocOwner={resultado.ocOwner} />
            <TimelineCard tag={resultado.tag} timeline={resultado.timeline} />
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Subcomponentes
// ============================================================

function Panel({ title, error = false, children }) {
  return (
    <div className={`rounded-card border shadow-card overflow-hidden ${
      error
        ? 'bg-anomaly-bg border-anomaly-ring/40'
        : 'bg-white border-ink-100 dark:bg-ink-700 dark:border-ink-600'
    }`}>
      {title && (
        <div className="px-4 py-2.5 border-b border-ink-100 dark:border-ink-600 font-mono text-[11px] font-bold uppercase tracking-industrial text-ink-400">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function QuickLink({ label, onClick, variant }) {
  const variantCls = variant === 'anomaly'
    ? 'border-anomaly-ring/40 text-anomaly hover:bg-anomaly-bg'
    : 'border-rfid/30 text-rfid hover:bg-rfid/10';
  return (
    <button onClick={onClick} className={`w-full px-3 py-2 rounded-card text-[13px] font-medium text-left transition-colors bg-white border ${variantCls} dark:bg-ink-700`}>
      {label}
    </button>
  );
}

function SkuMatchRow({ tag, onVer }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-ink-100 dark:border-ink-600">
      <div>
        <div className="font-mono text-[13px] text-ink-700 dark:text-ink-100 mb-1">{tag.epc}</div>
        <div className="text-[12px] text-ink-500">SKU: {tag.sku} · {tag.cantidad_piezas} pzas</div>
      </div>
      <button onClick={() => onVer(tag.epc)} className="shrink-0 px-3 py-1.5 rounded-card text-[12px] font-semibold bg-rfid text-white hover:bg-blue-700">
        Ver historial
      </button>
    </div>
  );
}

function PrepackInfoCard({ tag, ocOwner }) {
  const colorCSS = getColorCSS(tag.color || '');
  const esClaro = esColorClaro(tag.color || '');
  const etapaColor = ETAPA_COLORS[tag.etapa_actual] || '#94A3B8';

  return (
    <Panel title="Información del prepack">
      <div className="p-4 grid grid-cols-1 sm:grid-cols-[64px_1fr] gap-4">
        <div className="w-16 h-16 rounded-lg flex items-center justify-center shadow-card" style={{ background: colorCSS, border: esClaro ? '2px solid #E2E8F0' : 'none' }}>
          <span className="text-[10px] font-bold" style={{ color: esClaro ? '#1E293B' : 'white' }}>{tag.cantidad_piezas || 1}p</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InfoField label="EPC" value={tag.epc} mono span={3} />
          <InfoField label="SKU" value={tag.sku} />
          <InfoField label="Talla" value={tag.talla} />
          <InfoField label="Color" value={tag.color} />
          <InfoField label="Piezas" value={tag.cantidad_piezas} />
          <InfoField label="Tienda" value={tag.tienda?.nombre || tag.tienda_id} />
          <InfoField label="Etapa actual" value={ETAPA_LABELS[tag.etapa_actual] || tag.etapa_actual} valueStyle={{ color: etapaColor }} />
          {ocOwner && <InfoField label="Orden" value={ocOwner.ordenId} mono span={2} />}
        </div>
      </div>
    </Panel>
  );
}

function InfoField({ label, value, mono = false, span = 1, valueStyle }) {
  return (
    <div style={{ gridColumn: span > 1 ? `span ${span}` : undefined }}>
      <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 mb-0.5">{label}</div>
      <div className={`text-[13px] text-ink-700 dark:text-ink-100 break-all ${mono ? 'font-mono' : ''}`} style={valueStyle}>{value || '—'}</div>
    </div>
  );
}

function TimelineCard({ tag, timeline }) {
  const etapas = ETAPAS_ORDEN.map((etapa) => {
    const ev = timeline?.find(e => e.etapa === etapa);
    return { nombre: etapa, completada: !!ev, timestamp: ev?.tiempo };
  });

  return (
    <Panel title="Recorrido del prepack">
      <div className="p-6 overflow-x-auto">
        <div className="flex items-start min-w-max gap-4">
          {etapas.map((etapa) => (
            <div key={etapa.nombre} className="flex flex-col items-center gap-2 min-w-[80px]">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[9px] font-bold ${etapa.completada ? 'bg-flow text-white' : 'bg-ink-100 text-ink-400'}`}>
                {etapa.completada ? '✓' : '○'}
              </div>
              <div className="text-center">
                <div className="text-[10px] font-semibold uppercase">{ETAPA_LABELS[etapa.nombre]}</div>
                {etapa.timestamp && <div className="font-mono text-[9px] text-ink-400">{formatHora(etapa.timestamp)}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}