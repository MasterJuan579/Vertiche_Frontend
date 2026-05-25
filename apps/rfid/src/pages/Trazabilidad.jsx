import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DEMO_OCS,
  ETAPA_LABELS,
  ETAPA_COLORS,
  getPrepackByEpc,
  getColorCSS,
  esColorClaro,
} from '../data/demoOCs.js';
import { formatHora, epcCorto } from '../utils/format.js';

const ETAPAS_ORDEN = ['PREREGISTRO', 'QA', 'REGISTRO', 'SORTER', 'BAHIA', 'AUDITORIA', 'ENVIO'];

/**
 * EPC traceability — search by EPC or SKU, then show the prepack's journey
 * through all 7 stages of the CEDIS pipeline.
 *
 * Mock-only: the timeline is synthesized from the parent OC's etapa_logs.
 * The original called api.getTrazabilidad(epc) which returned a server-built
 * timeline; we re-derive it client-side.
 *
 * URL params:
 *   /rfid/trazabilidad         → empty search state
 *   /rfid/trazabilidad/:epc    → auto-search that EPC on mount
 *
 * Three demo quick-link buttons in the left column for first-time users.
 */
export function Trazabilidad() {
  const { epc: urlEpc } = useParams();
  const navigate = useNavigate();

  const [tipoBusqueda, setTipoBusqueda] = useState('epc');
  const [busqueda, setBusqueda] = useState(urlEpc || '');
  const [resultado, setResultado] = useState(null);
  const [resultadoLista, setResultadoLista] = useState(null);
  const [error, setError] = useState(null);

  // Auto-search if URL has an EPC param.
  useEffect(() => {
    if (urlEpc) {
      setBusqueda(urlEpc);
      setTipoBusqueda('epc');
      buscarEpc(urlEpc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlEpc]);

  function buscarEpc(epc) {
    setError(null);
    setResultado(null);
    setResultadoLista(null);

    const tag = getPrepackByEpc(epc);
    if (!tag) {
      setError(`No se encontró ningún prepack con EPC "${epc}".`);
      return;
    }

    // Build a timeline by walking the OC's etapa_logs.
    const ocOwner = DEMO_OCS.find((oc) => oc.ordenId === tag.ordenId);
    const timeline = buildTimeline(tag, ocOwner);

    setResultado({ tag, timeline, ocOwner });
  }

  function buscarSku(sku) {
    setError(null);
    setResultado(null);
    setResultadoLista(null);

    const normalizedSku = sku.trim().toLowerCase();
    const matches = DEMO_OCS.flatMap((oc) =>
      oc.tags
        .filter((t) => (t.sku || '').toLowerCase().includes(normalizedSku))
        .map((t) => ({ ...t, ordenId: oc.ordenId, ocNombre: oc.nombre }))
    );

    setResultadoLista(matches);
  }

  function buscar(epcOverride, skuOverride) {
    const query = epcOverride || skuOverride || busqueda.trim();
    const tipo = epcOverride ? 'epc' : skuOverride ? 'sku' : tipoBusqueda;
    if (!query) return;

    if (tipo === 'epc') {
      buscarEpc(query);
      // Reflect in URL so the search is bookmarkable.
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

      {/* ════════════ LEFT COLUMN ════════════ */}
      <div className="space-y-4">

        {/* Search panel */}
        <Panel title="Buscar Prepack">
          <div className="p-4 space-y-2.5">
            {/* EPC/SKU toggle */}
            <div className="flex rounded-card overflow-hidden border border-ink-100 dark:border-ink-500">
              {['epc', 'sku'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoBusqueda(t)}
                  className={
                    'flex-1 py-1.5 text-[12px] font-medium uppercase tracking-[0.04em] transition-colors ' +
                    (tipoBusqueda === t
                      ? 'bg-rfid text-white'
                      : 'bg-white text-ink-500 hover:bg-ink-50 dark:bg-ink-700 dark:text-ink-300 dark:hover:bg-ink-600')
                  }
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
              className={
                'w-full px-3 py-2 rounded-card text-[13px] outline-none ' +
                (tipoBusqueda === 'epc' ? 'font-mono' : '') + ' ' +
                'bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 ' +
                'focus:border-rfid ' +
                'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100'
              }
            />

            <button
              type="button"
              onClick={() => buscar()}
              disabled={!busqueda.trim()}
              className={
                'w-full py-2 rounded-card text-[13px] font-semibold transition-colors ' +
                (busqueda.trim()
                  ? 'bg-rfid text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                  : 'bg-ink-100 text-ink-400 cursor-not-allowed dark:bg-ink-600 dark:text-ink-400')
              }
            >
              Buscar
            </button>
          </div>
        </Panel>

        {/* Quick links */}
        <Panel title="Ejemplos rápidos">
          <div className="p-3 space-y-2">
            <QuickLink
              label="Prepack normal (E001A)"
              onClick={() => { setBusqueda('E001A'); buscar('E001A'); }}
            />
            <QuickLink
              label="Prepack con QA fallido (E006A)"
              onClick={() => { setBusqueda('E006A'); buscar('E006A'); }}
              variant="anomaly"
            />
            <QuickLink
              label="Prepack en envío (E022A)"
              onClick={() => { setBusqueda('E022A'); buscar('E022A'); }}
              variant="success"
            />
          </div>
        </Panel>
      </div>

      {/* ════════════ RIGHT COLUMN ════════════ */}
      <div className="space-y-4">

        {/* Empty state */}
        {!resultado && !resultadoLista && !error && (
          <Panel>
            <div className="px-6 py-12 text-center">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-[13px] text-ink-400">
                Ingresa un EPC o usa los accesos rápidos para ver el historial de un prepack
              </div>
            </div>
          </Panel>
        )}

        {/* Error state */}
        {error && (
          <Panel error>
            <div className="px-4 py-3 text-[13px] text-anomaly dark:text-anomaly-ring">
              {error}
            </div>
          </Panel>
        )}

        {/* SKU search results list */}
        {resultadoLista && (
          <Panel title={`Coincidencias SKU "${busqueda}" — ${resultadoLista.length} resultado${resultadoLista.length !== 1 ? 's' : ''}`}>
            {resultadoLista.length === 0 ? (
              <div className="px-6 py-6 text-center text-[13px] text-ink-400">
                No se encontraron tags con ese SKU.
              </div>
            ) : (
              <div>
                {resultadoLista.map((tag) => (
                  <SkuMatchRow key={tag.epc} tag={tag} onVer={verDetalle} />
                ))}
              </div>
            )}
          </Panel>
        )}

        {/* EPC detail */}
        {resultado?.tag && (
          <>
            <PrepackInfoCard tag={resultado.tag} ocOwner={resultado.ocOwner} />
            <TimelineCard tag={resultado.tag} timeline={resultado.timeline} />
            <EventsCard timeline={resultado.timeline} />
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Build a timeline for a tag from its OC's etapa_logs
// ════════════════════════════════════════════════════════════════════

function buildTimeline(tag, oc) {
  if (!oc) return [];
  const events = [];
  const ETAPA_IDX_LOCAL = Object.fromEntries(ETAPAS_ORDEN.map((e, i) => [e, i]));
  const currentIdx = ETAPA_IDX_LOCAL[tag.etapa_actual] ?? -1;

  ETAPAS_ORDEN.forEach((etapa, idx) => {
    if (idx > currentIdx) return; // not yet reached

    const log = (oc.etapa_logs || []).find((l) => l.etapa === etapa);

    // LECTURA event for this stage
    events.push({
      tipo: 'LECTURA',
      etapa,
      detalle: etapa,
      tiempo: log?.timestamp_entrada || null,
      lector: `LECTOR-${etapa}-01`,
      bahia: etapa === 'BAHIA' ? tag.tienda?.bahia_asignada : null,
    });

    // ANOMALIA event if the log flagged one
    if (log?.tiene_anomalia) {
      events.push({
        tipo: 'ANOMALIA',
        etapa,
        detalle: tag.qa_fallido ? 'QA_FALLIDO' : 'ANOMALIA_ETAPA',
        descripcion: tag.qa_fallido
          ? (tag.qa_motivo_fallo || 'Prenda defectuosa')
          : `Anomalía detectada en ${ETAPA_LABELS[etapa]}`,
        tiempo: log?.timestamp_entrada || null,
        bahia: etapa === 'BAHIA' ? tag.tienda?.bahia_asignada : null,
      });
    }
  });

  return events;
}

// ════════════════════════════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════════════════════════════

function Panel({ title, error = false, children }) {
  return (
    <div className={
      'rounded-card border shadow-card overflow-hidden ' +
      (error
        ? 'bg-anomaly-bg border-anomaly-ring/40 dark:bg-anomaly/15 dark:border-anomaly-ring/40'
        : 'bg-white border-ink-100 dark:bg-ink-700 dark:border-ink-600')
    }>
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
    ? 'border-anomaly-ring/40 text-anomaly hover:bg-anomaly-bg dark:border-anomaly-ring/40 dark:text-anomaly-ring dark:hover:bg-anomaly/15'
    : variant === 'success'
      ? 'border-flow-ring/40 text-flow hover:bg-flow-bg dark:border-flow-ring/40 dark:text-flow-ring dark:hover:bg-flow/15'
      : 'border-rfid/30 text-rfid hover:bg-rfid/10 dark:border-rfid/40 dark:text-blue-300 dark:hover:bg-rfid/20';

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'w-full px-3 py-2 rounded-card text-[13px] font-medium text-left transition-colors ' +
        'bg-white border ' + variantCls + ' ' +
        'dark:bg-ink-700'
      }
    >
      {label}
    </button>
  );
}

function SkuMatchRow({ tag, onVer }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-ink-100 dark:border-ink-600">
      <div className="min-w-0">
        <div className="font-mono text-[13px] text-ink-700 dark:text-ink-100 mb-1 truncate">
          {tag.epc}
        </div>
        <div className="text-[12px] text-ink-500 dark:text-ink-300">
          {tag.talla} · {tag.color} · {tag.cantidad_piezas || tag.total_prendas} pzas · {tag.tienda?.nombre || '—'}
        </div>
        <div className="text-[10px] text-ink-400 mt-0.5">
          OC: {tag.ordenId} — {tag.ocNombre}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onVer(tag.epc)}
        className={
          'shrink-0 px-3 py-1.5 rounded-card text-[12px] font-semibold transition-colors ' +
          'bg-rfid text-white hover:bg-blue-700 dark:hover:bg-blue-600'
        }
      >
        Ver historial
      </button>
    </div>
  );
}

function PrepackInfoCard({ tag, ocOwner }) {
  const colorPrincipal = tag.colores?.[0] || tag.color || '';
  const colorCSS = getColorCSS(colorPrincipal);
  const esClaro = esColorClaro(colorPrincipal);
  const etapaColor = ETAPA_COLORS[tag.etapa_actual] || '#94A3B8';

  return (
    <Panel title="Información del prepack">
      <div className="p-4 grid grid-cols-1 sm:grid-cols-[64px_1fr] gap-4 items-start">
        {/* Color preview */}
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center shadow-card shrink-0"
          style={{
            background: colorCSS,
            border: esClaro ? '2px solid #E2E8F0' : 'none',
          }}
        >
          <span
            className="text-[10px] font-bold text-center leading-tight"
            style={{ color: esClaro ? '#1E293B' : '#FFFFFF' }}
          >
            {tag.total_prendas || tag.cantidad_piezas}p
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
          <InfoField label="EPC" value={tag.epc} mono span={3} />
          <InfoField label="SKU" value={tag.sku} />
          <InfoField label="Talla" value={tag.talla} />
          <InfoField label="Color" value={colorPrincipal} />
          <InfoField label="Piezas" value={tag.cantidad_piezas || tag.total_prendas} />
          <InfoField label="Tienda" value={tag.tienda?.nombre} />
          <InfoField label="Tipo flujo" value={tag.tipo_flujo} />
          <InfoField
            label="Etapa actual"
            value={ETAPA_LABELS[tag.etapa_actual] || tag.etapa_actual}
            valueStyle={{ color: etapaColor, fontWeight: 700 }}
          />
          {ocOwner && (
            <>
              <InfoField label="Orden" value={ocOwner.ordenId} mono />
              <InfoField label="Proveedor" value={ocOwner.proveedor} span={2} />
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

function InfoField({ label, value, mono = false, span = 1, valueStyle }) {
  return (
    <div style={{ gridColumn: span > 1 ? `span ${span}` : undefined }}>
      <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 mb-0.5">
        {label}
      </div>
      <div
        className={
          'text-[13px] text-ink-700 dark:text-ink-100 break-all ' +
          (mono ? 'font-mono' : '')
        }
        style={valueStyle}
      >
        {value || '—'}
      </div>
    </div>
  );
}

function TimelineCard({ tag, timeline }) {
  const tipoFlujo = tag.tipo_flujo;
  const etapas = ETAPAS_ORDEN.map((etapa) => {
    const ev = timeline.find((e) => e.tipo === 'LECTURA' && e.etapa === etapa);
    const tieneError = timeline.some((e) => e.tipo === 'ANOMALIA' && e.etapa === etapa);
    const esAlmacen = tipoFlujo === 'NUEVA_TIENDA' || tipoFlujo === 'REFILL';
    const noAplica = esAlmacen && ['SORTER', 'BAHIA', 'AUDITORIA', 'ENVIO'].includes(etapa);

    return {
      nombre: etapa,
      completada: !!ev,
      noAplica,
      timestamp: ev?.tiempo,
      tieneError,
    };
  });

  return (
    <Panel title="Recorrido del prepack">
      <div className="p-6 overflow-x-auto">
        <div className="flex items-start min-w-max relative">
          {/* Background line */}
          <div className="absolute top-[17px] left-[8%] right-[8%] h-0.5 bg-ink-100 dark:bg-ink-600 z-0" />

          {etapas.map((etapa) => {
            const isReached = etapa.completada && !etapa.noAplica;
            const isError = etapa.tieneError;

            let bgCls, textCls, label;
            if (etapa.noAplica) {
              bgCls = 'bg-ink-50 dark:bg-ink-800';
              textCls = 'text-ink-400';
              label = 'N/A';
            } else if (!etapa.completada) {
              bgCls = 'bg-ink-100 dark:bg-ink-600';
              textCls = 'text-ink-400';
              label = '';
            } else if (isError) {
              bgCls = 'bg-anomaly dark:bg-anomaly-ring';
              textCls = 'text-white';
              label = 'ERR';
            } else {
              bgCls = 'bg-flow dark:bg-flow-ring';
              textCls = 'text-white';
              label = 'OK';
            }

            return (
              <div key={etapa.nombre} className="flex-1 flex flex-col items-center gap-2 z-10 min-w-[80px]">
                <div className={
                  'w-9 h-9 rounded-full border-[3px] border-white dark:border-ink-700 ' +
                  'flex items-center justify-center text-[9px] font-bold ' +
                  bgCls + ' ' + textCls
                }
                  style={{ boxShadow: isError ? '0 0 0 2px #ef4444' : isReached ? '0 0 0 2px var(--tw-shadow-color)' : undefined }}
                >
                  {label}
                </div>
                <div className="text-center">
                  <div className={
                    'text-[10px] font-semibold uppercase tracking-industrial ' +
                    (isReached ? 'text-ink-700 dark:text-ink-100' : 'text-ink-400')
                  }>
                    {ETAPA_LABELS[etapa.nombre]}
                  </div>
                  {etapa.timestamp && (
                    <div className="font-mono text-[9px] text-ink-400 mt-0.5">
                      {formatHora(etapa.timestamp)}
                    </div>
                  )}
                  {etapa.noAplica && (
                    <div className="text-[9px] text-ink-400 mt-0.5">En almacén</div>
                  )}
                  {etapa.tieneError && (
                    <div className="text-[9px] font-bold text-anomaly dark:text-anomaly-ring mt-0.5">
                      ANOMALÍA
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function EventsCard({ timeline }) {
  const events = timeline || [];

  return (
    <Panel title={`Eventos registrados — ${events.length}`}>
      {events.length === 0 ? (
        <div className="px-6 py-6 text-center text-[13px] text-ink-400">
          Sin eventos registrados.
        </div>
      ) : (
        <div>
          {/* Header row */}
          <div className={
            'grid grid-cols-[160px_120px_180px_1fr] gap-2 items-center ' +
            'px-4 py-2 border-b border-ink-100 dark:border-ink-600 ' +
            'bg-ink-50 dark:bg-ink-800 ' +
            'font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400'
          }>
            <span>Fecha / Hora</span>
            <span>Etapa</span>
            <span>Lector</span>
            <span>Detalle</span>
          </div>
          {events.map((ev, i) => {
            const esAnomalia = ev.tipo === 'ANOMALIA';
            const stageColor = ETAPA_COLORS[ev.etapa] || '#94A3B8';
            return (
              <div
                key={i}
                className={
                  'grid grid-cols-[160px_120px_180px_1fr] gap-2 items-center ' +
                  'px-4 py-2.5 border-b border-ink-100 dark:border-ink-600 text-[13px] ' +
                  (esAnomalia
                    ? 'bg-anomaly-bg dark:bg-anomaly/15'
                    : i % 2 === 0
                      ? 'bg-white dark:bg-ink-700'
                      : 'bg-ink-50/40 dark:bg-ink-800/40')
                }
              >
                <span className="font-mono text-[11px] text-ink-500 dark:text-ink-300">
                  {ev.tiempo ? new Date(ev.tiempo).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' }) : '—'}
                </span>
                <span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-industrial px-1.5 py-0.5 rounded"
                    style={{
                      background: esAnomalia ? '#FEE2E2' : `${stageColor}1f`,
                      color: esAnomalia ? '#991B1B' : stageColor,
                      border: `1px solid ${esAnomalia ? '#FECACA' : `${stageColor}55`}`,
                    }}
                  >
                    {ev.detalle || ev.tipo}
                  </span>
                </span>
                <span className="text-[12px] text-ink-500 dark:text-ink-300 truncate">
                  {ev.lector || '—'}
                </span>
                <span className="text-[12px] text-ink-500 dark:text-ink-300 truncate">
                  {ev.descripcion || (ev.bahia ? `Bahía: ${ev.bahia}` : '—')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
