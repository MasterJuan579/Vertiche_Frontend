import { useState, useEffect, useRef } from 'react';
import { ETAPAS_FLUJO, ETAPA_COLORS, parseBahiaNumero } from '../data/etapas.js';
import { ModalOC } from '../components/ModalOC.jsx';
import { ModalResumenOC } from '../components/ModalResumenOC.jsx';
import { realApi } from '../services/realApi.js';
import { onSocket } from '../services/socketClient.js';

/**
 * Supervisor's home view. Tres secciones verticales:
 *   1. BarraKPI    — KPIs derivados de las órdenes y tags reales.
 *   2. Gantt       — fila por OC, 7 columnas (etapas).
 *   3. Bay grid    — 10 bahías × 3 zonas, con la cantidad de OCs por bahía/zona.
 *
 * Carga datos reales desde el backend cada 10s.
 */

const ZONA_LABELS = { BAHIA: 'Bahías', AUDITORIA: 'Auditoría', ENVIO: 'Envío' };
const ZONA_ACCENT = { BAHIA: '#0891B2', AUDITORIA: '#DB2777', ENVIO: '#16A34A' };

/**
 * Mapeo del enum DB `Tag.etapa_actual` a la etapa visual del Gantt.
 * El esquema MySQL guarda EstadoPrepack:
 *   REGISTRADO, EN_QA, APROBADO, EN_SORTING, EN_CAJA, EN_AUDITORIA, RECHAZADO, ENVIADO.
 * Hay un lector RFID físico en cada etapa, así que cada estado tiene su columna.
 * El Gantt visual usa: PREREGISTRO, QA, REGISTRO, SORTER, BAHIA, AUDITORIA, ENVIO.
 * Un tag aparece SOLO en la etapa donde está actualmente, no en las anteriores.
 */
const ETAPA_DB_TO_GANTT = {
  REGISTRADO:   'PREREGISTRO',
  EN_QA:        'QA',
  APROBADO:     'REGISTRO',
  EN_SORTING:   'SORTER',
  EN_CAJA:      'BAHIA',
  EN_AUDITORIA: 'AUDITORIA',
  RECHAZADO:    'QA',
  ENVIADO:      'ENVIO',
};

export function FlujoCEDIS() {
  const [pausado, setPausado] = useState(false);
  const [panelBahia, setPanelBahia] = useState(null);
  const [ocModalOpen, setOcModalOpen] = useState(null);
  const [ocResumenOpen, setOcResumenOpen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [ocsView, setOcsView] = useState([]);
  const [kpiView, setKpiView] = useState(emptyKpi());

  const pausadoRef = useRef(pausado);
  useEffect(() => { pausadoRef.current = pausado; }, [pausado]);

  useEffect(() => {
    cargarDatos();
    // Polling de respaldo cada 30s — el grueso de los updates llega por socket.
    const interval = setInterval(() => {
      if (!pausadoRef.current) cargarDatos();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Tiempo real: recarga el Gantt cuando llega cualquier 'lectura' o 'tag'.
  // El cálculo de tagsPorEtapa depende del set completo, así que es más simple
  // recargar que mutar local.
  useEffect(() => {
    const refrescar = () => { if (!pausadoRef.current) cargarDatos(); };
    const offLectura = onSocket('lectura', refrescar);
    const offTag = onSocket('tag', refrescar);
    const offAnomalia = onSocket('anomalia', refrescar);
    return () => {
      offLectura();
      offTag();
      offAnomalia();
    };
  }, []);

  async function cargarDatos() {
    try {
      setError(null);
      const [ordenes, tags, anomalias, kpiBackend] = await Promise.all([
        realApi.getOrdenesCompra(),
        realApi.getTags(),
        realApi.getAnomalias({ soloAbiertas: true }),
        realApi.getKpi().catch(() => null), // si falla, fallback al kpi local
      ]);
      const { ocs, kpi: kpiLocal } = buildOcsView(ordenes || [], tags || [], anomalias || []);
      setOcsView(ocs);
      // Mezcla: lo del backend pisa lo local cuando viene definido.
      setKpiView({
        ...kpiLocal,
        ...(kpiBackend && {
          mejora_porcentaje: kpiBackend.mejora_porcentaje,
          objetivo_mejora_pct: kpiBackend.objetivo_mejora_pct,
          tiempo_promedio_hoy_min: kpiBackend.tiempo_promedio_min,
          palets_activos: kpiBackend.palets_activos,
          palets_completados_hoy: kpiBackend.palets_completados_hoy,
        }),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function ocsEnBahiaYEtapa(numBahia, etapa) {
    // El backend devuelve `bahia_asignada` como `B-06`; comparamos por número
    // para no acoplarnos al formato del string.
    return ocsView.filter((oc) =>
      (oc.tagsPorEtapa?.[etapa] || []).some(
        (t) => parseBahiaNumero(t.tienda?.bahia_asignada) === numBahia
      )
    );
  }

  const openModalDetalle = (oc, etapaOrigen) => setOcModalOpen({ oc, etapaOrigen });
  const openModalResumen = (oc) => setOcResumenOpen(oc);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl mb-2">📦</div>
          <div className="text-ink-400">Cargando flujo del CEDIS...</div>
          <div className="text-xs text-ink-300 mt-2">Conectando con {import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-anomaly dark:text-anomaly-ring">{error}</div>
          <button
            onClick={() => { setCargando(true); cargarDatos(); }}
            className="mt-4 px-4 py-2 bg-rfid text-white rounded-card text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BarraKPI
        kpi={kpiView}
        pausado={pausado}
        onTogglePausa={() => setPausado((p) => !p)}
      />

      <Panel>
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-ink-600 flex-wrap gap-2">
          <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 flex items-center gap-2">
            Flujo del CEDIS
            {pausado && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-flow-bg text-flow dark:bg-flow/20 dark:text-flow-ring">
                ⏸ Pausado
              </span>
            )}
            <span className="font-normal text-ink-400">— {ocsView.length} OCs activas</span>
          </div>
          <button
            onClick={cargarDatos}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white border border-ink-100 text-ink-500 hover:bg-ink-50 hover:text-ink-700 dark:bg-ink-700 dark:border-ink-500 dark:text-ink-300 dark:hover:bg-ink-600 dark:hover:text-ink-100 transition-colors"
            title="Recargar datos del backend"
          >
            <RefreshIcon />
            Actualizar
          </button>
        </div>

        <div className="px-5 py-4">
          {ocsView.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-ink-400">
              <div className="text-2xl mb-2">📭</div>
              Sin órdenes de compra activas.
              <div className="text-xs mt-2">
                Crea una orden desde el backend con:
                <code className="block mt-1 text-xs bg-ink-100 p-1 rounded">
                  POST /OrdenCompra/crearOrden
                </code>
              </div>
            </div>
          ) : (
            <Gantt
              ocs={ocsView}
              onClickSegmento={openModalDetalle}
              onClickNombre={openModalResumen}
            />
          )}

          {ocsView.length > 0 && (
            <div className="border-t border-ink-100 dark:border-ink-600 pt-4 mt-6">
              <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 mb-3">
                Estado por bahía
              </div>

              {[
                { zona: 'BAHIA', label: ZONA_LABELS.BAHIA, color: ZONA_ACCENT.BAHIA },
                { zona: 'AUDITORIA', label: ZONA_LABELS.AUDITORIA, color: ZONA_ACCENT.AUDITORIA },
                { zona: 'ENVIO', label: ZONA_LABELS.ENVIO, color: ZONA_ACCENT.ENVIO },
              ].map((fila) => (
                <BayRow
                  key={fila.zona}
                  fila={fila}
                  ocsEnBahiaYEtapa={ocsEnBahiaYEtapa}
                  activeKey={panelBahia?.key}
                  onClickCell={(numBahia) => {
                    const key = `${fila.zona}-B${numBahia}`;
                    if (panelBahia?.key === key) {
                      setPanelBahia(null);
                    } else {
                      const ocsB = ocsEnBahiaYEtapa(numBahia, fila.zona);
                      setPanelBahia({
                        key,
                        titulo: `${fila.label} — Bahía ${numBahia}`,
                        numBahia,
                        zona: fila.zona,
                        ocs: ocsB,
                      });
                    }
                  }}
                />
              ))}

              {panelBahia && (
                <PanelBahia
                  titulo={panelBahia.titulo}
                  ocs={panelBahia.ocs}
                  numBahia={panelBahia.numBahia}
                  zona={panelBahia.zona}
                  onClose={() => setPanelBahia(null)}
                  onAbrirOC={openModalDetalle}
                />
              )}
            </div>
          )}
        </div>
      </Panel>

      {ocModalOpen && (
        <ModalOC
          oc={ocModalOpen.oc}
          etapaOrigen={ocModalOpen.etapaOrigen}
          onClose={() => setOcModalOpen(null)}
        />
      )}
      {ocResumenOpen && (
        <ModalResumenOC
          oc={ocResumenOpen}
          onClose={() => setOcResumenOpen(null)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Vista derivada — funciones puras
// ════════════════════════════════════════════════════════════════════

function emptyKpi() {
  return {
    mejora_porcentaje: null,
    objetivo_mejora_pct: 32,
    tiempo_promedio_hoy_min: null,
    palets_activos: 0,
    palets_completados_hoy: 0,
  };
}

/**
 * Toma OCs, tags y anomalías crudos del backend y construye:
 *   - ocs[]: cada OC con tagsPorEtapa, idxMin/idxMax, hasErr, pct…
 *   - kpi: agregados básicos
 *
 * Se vincula Tag → OC vía tag.orden_id (lo expone TagController.serializarTag
 * leyéndolo del Palet asociado). Si el Tag no tiene palet aún, queda fuera del
 * Gantt — es esperado, todavía no entró al flujo.
 */
function buildOcsView(ordenes, tags, anomalias) {
  const anomaliasPorEpc = new Map();
  for (const a of anomalias) {
    if (a.epc) {
      anomaliasPorEpc.set(a.epc, (anomaliasPorEpc.get(a.epc) || 0) + 1);
    }
  }

  const ocs = ordenes.map((oc) => {
    const tagsDeOC = tags.filter((t) => t.orden_id === oc.orden_id);
    const tagsPorEtapa = agruparTagsPorEtapaGantt(tagsDeOC);
    const etapasConTags = ETAPAS_FLUJO.map((e, i) => ({ id: e.id, idx: i }))
      .filter(({ id }) => (tagsPorEtapa[id]?.length ?? 0) > 0);
    const idxMin = etapasConTags.length ? etapasConTags[0].idx : 0;
    const idxMax = etapasConTags.length ? etapasConTags[etapasConTags.length - 1].idx : 0;

    const total_esperados = oc.total_esperados || 0;
    const total_recibidos = oc.total_recibidos || 0;
    const pct = total_esperados > 0 ? (total_recibidos / total_esperados) * 100 : 0;

    const hasErr =
      tagsDeOC.some((t) => t.qa_fallido) ||
      tagsDeOC.some((t) => anomaliasPorEpc.has(t.epc));

    return {
      orden_id: oc.orden_id,
      ordenId: oc.orden_id,
      nombre: oc.nombre_producto || `OC ${oc.orden_id}`,
      proveedor: oc.Proveedor?.nombre || oc.proveedor?.nombre || 'Proveedor',
      totalPrepacks: total_esperados,
      total_esperados,
      total_recibidos,
      faltantes: Math.max(0, total_esperados - total_recibidos),
      estado: oc.estado,
      pct,
      hasErr,
      tags: tagsDeOC,
      tagsPorEtapa,
      etapasActivas: etapasConTags.map((e) => e.id),
      idxMin,
      idxMax,
      etapa_logs: [],
      Proveedor: oc.Proveedor,
    };
  });

  const kpi = {
    mejora_porcentaje: null,
    objetivo_mejora_pct: 32,
    tiempo_promedio_hoy_min: null,
    palets_activos: ocs.filter((o) => o.estado !== 'CANCELADA' && o.estado !== 'RECIBIDA').length,
    palets_completados_hoy: ocs.filter((o) => o.estado === 'RECIBIDA').length,
  };

  return { ocs, kpi };
}

function agruparTagsPorEtapaGantt(tags) {
  const grupos = Object.fromEntries(ETAPAS_FLUJO.map((e) => [e.id, []]));
  for (const tag of tags) {
    const etapaGantt = ETAPA_DB_TO_GANTT[tag.etapa_actual];
    if (etapaGantt && grupos[etapaGantt]) {
      grupos[etapaGantt].push(tag);
    }
  }
  return grupos;
}

// ════════════════════════════════════════════════════════════════════
// KPI BAR
// ════════════════════════════════════════════════════════════════════

function BarraKPI({ kpi, pausado, onTogglePausa }) {
  const mejora = kpi?.mejora_porcentaje ?? null;
  const meta = kpi?.objetivo_mejora_pct || 32;
  const metaOk = mejora !== null && mejora >= meta;

  const sem = mejora === null
    ? 'gris'
    : metaOk ? 'verde' : mejora >= 20 ? 'amarillo' : 'rojo';

  const semClass = {
    verde:    'bg-flow-bg border-flow-ring/40 text-flow dark:bg-flow/20 dark:border-flow-ring/40 dark:text-flow-ring',
    amarillo: 'bg-attention-bg border-attention-ring/40 text-attention dark:bg-attention/20 dark:border-attention-ring/40 dark:text-attention-ring',
    rojo:     'bg-anomaly-bg border-anomaly-ring/40 text-anomaly dark:bg-anomaly/20 dark:border-anomaly-ring/40 dark:text-anomaly-ring',
    gris:     'bg-ink-50 border-ink-100 text-ink-400 dark:bg-ink-700 dark:border-ink-500 dark:text-ink-400',
  }[sem];

  const dotClass = {
    verde:    'bg-flow-ring',
    amarillo: 'bg-attention-ring',
    rojo:     'bg-anomaly-ring animate-[pulse-rojo_1.4s_ease-in-out_infinite]',
    gris:     'bg-ink-300',
  }[sem];

  const cicloLabel = kpi?.tiempo_promedio_hoy_min
    ? `${Math.floor(kpi.tiempo_promedio_hoy_min / 60)}h ${kpi.tiempo_promedio_hoy_min % 60}min`
    : '—';

  return (
    <div className={
      'flex items-center gap-0 px-5 h-[62px] rounded-card shadow-card overflow-x-auto ' +
      'bg-white border border-ink-100 ' +
      'dark:bg-ink-700 dark:border-ink-600'
    }>
      <div className={'flex items-center gap-3 mr-5 px-4 py-2 rounded-card border-[1.5px] shrink-0 ' + semClass}>
        <span className={'w-3.5 h-3.5 rounded-full shrink-0 ' + dotClass} />
        <div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-industrial mb-0.5">
            Mejora vs manual · meta: {meta}%
          </div>
          <div className="text-[24px] font-extrabold leading-none">
            {mejora !== null ? `${mejora.toFixed(1)}%` : '—'}
            {metaOk && (
              <span className="text-[11px] font-semibold ml-2">✓ Meta cumplida</span>
            )}
          </div>
        </div>
      </div>

      <div className="w-px h-8 bg-ink-100 dark:bg-ink-600 mr-5 shrink-0" />

      {[
        { label: 'Ciclo promedio', value: cicloLabel,                        accent: 'text-ink-700 dark:text-ink-100' },
        { label: 'OCs activas',    value: kpi?.palets_activos ?? '—',        accent: 'text-ink-700 dark:text-ink-100' },
        { label: 'Completadas hoy', value: kpi?.palets_completados_hoy ?? '—', accent: 'text-flow dark:text-flow-ring' },
      ].map((s) => (
        <div key={s.label} className="mr-6 shrink-0">
          <div className={'text-[20px] font-extrabold leading-none ' + s.accent}>{s.value}</div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 mt-0.5">
            {s.label}
          </div>
        </div>
      ))}

      <div className="flex-1" />
      <div className="w-px h-8 bg-ink-100 dark:bg-ink-600 mr-3 shrink-0" />

      <button
        type="button"
        onClick={onTogglePausa}
        className={
          'flex items-center gap-1.5 px-3.5 py-1.5 rounded-card border-[1.5px] text-[11px] font-bold transition-colors shrink-0 ' +
          (pausado
            ? 'bg-flow-bg border-flow-ring/40 text-flow dark:bg-flow/20 dark:border-flow-ring/40 dark:text-flow-ring'
            : 'bg-ink-50 border-ink-100 text-ink-400 hover:bg-ink-100 dark:bg-ink-700 dark:border-ink-500 dark:text-ink-300 dark:hover:bg-ink-600')
        }
      >
        <span className="text-[13px]">{pausado ? '▶' : '⏸'}</span>
        {pausado ? 'Reanudar' : 'Pausar'}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// GANTT
// ════════════════════════════════════════════════════════════════════

function Gantt({ ocs, onClickSegmento, onClickNombre }) {
  const GANTT_COLS = `180px repeat(${ETAPAS_FLUJO.length}, 1fr)`;

  return (
    <div className="overflow-x-auto mb-3">
      <div className="min-w-[800px]">
        <div className="grid mb-1" style={{ gridTemplateColumns: GANTT_COLS }}>
          <div className="pl-3 pb-1.5 border-b-2 border-ink-100 dark:border-ink-600">
            <span className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400">
              Orden de compra
            </span>
          </div>
          {ETAPAS_FLUJO.map((etapa) => (
            <div
              key={etapa.id}
              className="text-center pb-1.5"
              style={{ borderBottom: `2px solid ${ETAPA_COLORS[etapa.id]}` }}
            >
              <div
                className="font-mono text-[9px] font-bold uppercase tracking-industrial"
                style={{ color: ETAPA_COLORS[etapa.id] }}
              >
                {etapa.short}
              </div>
            </div>
          ))}
        </div>

        {ocs.map((oc) => (
          <BarraOC
            key={oc.ordenId}
            oc={oc}
            columnWidths={GANTT_COLS}
            onClickSegmento={onClickSegmento}
            onClickNombre={onClickNombre}
          />
        ))}
      </div>
    </div>
  );
}

function BarraOC({ oc, columnWidths, onClickSegmento, onClickNombre }) {
  return (
    <div
      className="grid w-full items-center border-b border-ink-100 dark:border-ink-600"
      style={{ gridTemplateColumns: columnWidths, minHeight: 44 }}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onClickNombre(oc); }}
        className={
          'sticky left-0 z-[2] flex flex-col justify-center cursor-pointer ' +
          'border-r border-ink-100 dark:border-ink-600 pl-3 pr-2 ' +
          'bg-white hover:bg-rfid/5 ' +
          'dark:bg-ink-700 dark:hover:bg-rfid/10 transition-colors'
        }
        style={{ minHeight: 44 }}
      >
        <div className="text-[12px] font-semibold text-ink-700 dark:text-ink-100 truncate max-w-[160px]">
          {oc.nombre}
        </div>
        <div className="font-mono text-[9px] text-ink-400 truncate">
          {oc.totalPrepacks} prep. · {oc.proveedor}
        </div>
      </div>

      {ETAPAS_FLUJO.map((etapa, idx) => {
        const tagsEnEtapa = oc.tagsPorEtapa[etapa.id] || [];
        const tienePrep = tagsEnEtapa.length > 0;
        const enRango = idx >= oc.idxMin && idx <= oc.idxMax;
        const errEnEtapa = tagsEnEtapa.some((t) => t.qa_fallido === true);
        const color = ETAPA_COLORS[etapa.id] || '#94A3B8';
        const datos = tienePrep ? getDatosEtapa(etapa.id, tagsEnEtapa, oc) : null;

        return (
          <StageCell
            key={etapa.id}
            tienePrep={tienePrep}
            enRango={enRango}
            errEnEtapa={errEnEtapa}
            color={color}
            datos={datos}
            tagsEnEtapaCount={tagsEnEtapa.length}
            totalPrepacks={oc.totalPrepacks}
            onClick={() => tienePrep && onClickSegmento(oc, etapa.id)}
          />
        );
      })}
    </div>
  );
}

function StageCell({ tienePrep, enRango, errEnEtapa, color, datos, tagsEnEtapaCount, totalPrepacks, onClick }) {
  if (!tienePrep && !enRango) {
    return <div className="h-9 m-[3px_2px]" />;
  }

  if (!tienePrep && enRango) {
    return (
      <div className="h-9 m-[3px_2px] rounded-md flex items-center justify-center bg-ink-50/50 border border-dashed border-ink-100 dark:bg-ink-800/30 dark:border-ink-600">
        <div className="w-5 h-0.5 rounded bg-ink-200 dark:bg-ink-500" />
      </div>
    );
  }

  const pctWidth = totalPrepacks > 0 ? Math.min(100, Math.round((tagsEnEtapaCount / totalPrepacks) * 100)) : 0;
  const bg = errEnEtapa ? 'rgba(239, 68, 68, 0.12)' : `${color}1f`;
  const border = errEnEtapa ? '#FCA5A5' : `${color}66`;

  return (
    <div
      onClick={onClick}
      className="h-9 m-[3px_2px] rounded-md relative overflow-hidden cursor-pointer transition-all flex items-center justify-center"
      style={{ background: bg, border: `1.5px solid ${border}` }}
      title={`${tagsEnEtapaCount} prepacks actualmente en esta etapa`}
      onMouseEnter={(e) => {
        if (!errEnEtapa) {
          e.currentTarget.style.background = `${color}3a`;
          e.currentTarget.style.borderColor = color;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = bg;
        e.currentTarget.style.borderColor = border;
      }}
    >
      {/* Barra de progreso de fondo */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-l-md pointer-events-none"
        style={{ width: `${pctWidth}%`, background: `${color}10` }}
      />

      {/* 3 valores apilados con labels acortados */}
      <div className="flex items-center w-full justify-around px-1.5 z-[1] relative">
        {datos.map((d, i) => (
          <div key={i} className="text-center flex-1 min-w-0">
            <div
              className="text-[13px] font-extrabold leading-none truncate"
              style={{ color: errEnEtapa ? '#DC2626' : color }}
            >
              {d.v}
            </div>
            {d.l && (
              <div
                className="text-[7px] font-bold uppercase tracking-industrial mt-0.5 opacity-80 leading-tight truncate"
                style={{ color: errEnEtapa ? '#991B1B' : color }}
              >
                {d.l}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Badge anomalía */}
      {errEnEtapa && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-anomaly border-2 border-white animate-[pulse-rojo_1.4s_ease-in-out_infinite]" />
      )}
    </div>
  );
}

/**
 * Información apilada por etapa (lógica original: cuenta solo los tags que
 * están AHORA en esta etapa). Labels acortados para que no se corten en
 * pantallas chicas.
 */
function getDatosEtapa(etapaId, tagsEnEtapa, oc) {
  const total = oc.totalPrepacks || tagsEnEtapa.length;
  const n = tagsEnEtapa.length;
  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
  const err = tagsEnEtapa.filter((t) => t.qa_fallido).length;
  const ok = n - err;
  const pctOk = n > 0 ? Math.round((ok / n) * 100) : 100;
  const esp = oc.total_esperados || total;

  return ({
    PREREGISTRO: [
      { l: 'recib.',  v: n },
      { l: 'esp.',    v: esp },
      { l: '%',       v: `${pct}%` },
    ],
    QA: [
      { l: 'revis.',  v: n },
      { l: 'aprob.',  v: ok },
      { l: 'calid.',  v: `${pctOk}%` },
    ],
    REGISTRO: [
      { l: 'regis.',  v: n },
      { l: 'de',      v: total },
      { l: 'avance',  v: `${pct}%` },
    ],
    SORTER: [
      { l: 'clasif.', v: n },
      { l: 'total',   v: total },
      { l: 'proc.',   v: `${pct}%` },
    ],
    BAHIA: [
      { l: 'bahía',   v: n },
      { l: 'total',   v: total },
      { l: 'distr.',  v: `${pct}%` },
    ],
    AUDITORIA: [
      { l: 'audit.',  v: n },
      { l: 'aprob.',  v: ok },
      { l: 'aprob.%', v: `${pctOk}%` },
    ],
    ENVIO: [
      { l: 'envío',   v: n },
      { l: 'de',      v: total },
      { l: 'compl.',  v: `${pct}%` },
    ],
  })[etapaId] || [
    { l: 'prepacks', v: n },
    { l: '',         v: '' },
    { l: '%',        v: `${pct}%` },
  ];
}

// ════════════════════════════════════════════════════════════════════
// BAY GRID
// ════════════════════════════════════════════════════════════════════

function BayRow({ fila, ocsEnBahiaYEtapa, activeKey, onClickCell }) {
  return (
    <div className="flex items-center gap-0 mb-2">
      <div className="w-20 shrink-0 flex items-center justify-end pr-3">
        <span className="font-mono text-[9px] font-bold uppercase tracking-industrial" style={{ color: fila.color }}>
          {fila.label}
        </span>
      </div>
      <div className="flex-1 flex gap-1.5 overflow-x-auto justify-center">
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1;
          const ocsB = ocsEnBahiaYEtapa(n, fila.zona);
          const err = ocsB.some((o) => o.hasErr);
          const key = `${fila.zona}-B${n}`;
          const activa = activeKey === key;

          // Tiendas distintas que reciben prepacks en esta bahía en esta zona.
          // Sirve para el tooltip y para que el usuario sepa "Bahía 5 → CDMX y Puebla".
          const tiendasEnEstaBahia = (() => {
            const map = new Map();
            for (const oc of ocsB) {
              const tagsZona = oc.tagsPorEtapa?.[fila.zona] || [];
              for (const t of tagsZona) {
                if (parseBahiaNumero(t.tienda?.bahia_asignada) !== n) continue;
                const tid = t.tienda?.tienda_id || t.tienda_id;
                if (!tid) continue;
                if (!map.has(tid)) {
                  map.set(tid, { tienda_id: tid, nombre: t.tienda?.nombre || tid, count: 0 });
                }
                map.get(tid).count += 1;
              }
            }
            return Array.from(map.values()).sort((a, b) => b.count - a.count);
          })();

          return (
            <BayCell
              key={n}
              bahia={n}
              n={ocsB.length}
              hasErr={err}
              activa={activa}
              ocs={ocsB}
              tiendas={tiendasEnEstaBahia}
              shape={fila.zona === 'BAHIA' ? 'pill' : 'rect'}
              zonaColor={fila.color}
              onClick={() => onClickCell(n)}
            />
          );
        })}
      </div>
    </div>
  );
}

function BayCell({ bahia, n, hasErr, activa, ocs, tiendas = [], shape, onClick }) {
  const vacia = n === 0;
  const sem = vacia ? 'gris' : hasErr ? 'rojo' : 'verde';
  const bahiaId = `B-${String(bahia).padStart(2, '0')}`;
  // Suma de prepacks en esta zona y bahía (no el total general de la OC).
  const prepsAqui = tiendas.reduce((s, t) => s + t.count, 0);

  const baseCls = shape === 'pill' ? 'rounded-full' : 'rounded-card';
  const widthCls = 'w-[110px]';
  const heightCls = 'min-h-[96px]';

  const dotCls = {
    verde:    'bg-flow-ring',
    rojo:     'bg-anomaly-ring animate-[pulse-rojo_1.4s_ease-in-out_infinite]',
    gris:     'bg-ink-300',
  }[sem];

  const bgCls = activa
    ? 'bg-rfid/15 dark:bg-rfid/20'
    : vacia ? 'bg-ink-50 dark:bg-ink-800'
    : hasErr ? 'bg-anomaly-bg dark:bg-anomaly/15'
    : 'bg-white dark:bg-ink-700';

  const borderCls = activa
    ? 'border-rfid border-[2.5px]'
    : vacia ? 'border-ink-100 border-2 dark:border-ink-600'
    : hasErr ? 'border-anomaly-ring/40 border-2 dark:border-anomaly-ring/40'
    : 'border-ink-100 border-2 dark:border-ink-600';

  // Tooltip con tiendas destino — útil cuando hay varias y no caben inline.
  const tooltipTiendas = tiendas.length > 0
    ? tiendas.map((t) => `${t.nombre} (${t.count})`).join(' · ')
    : null;
  const titulo = vacia
    ? `${bahiaId} — sin prepacks en esta etapa`
    : tooltipTiendas
      ? `${bahiaId} — ${tooltipTiendas}`
      : `${bahiaId} — ${n} OC${n !== 1 ? 's' : ''}`;

  const tiendaPrincipal = tiendas[0];
  const restantes = tiendas.length - 1;

  return (
    <button
      type="button"
      disabled={vacia}
      onClick={vacia ? undefined : onClick}
      title={titulo}
      className={
        'relative ' +
        baseCls + ' ' + widthCls + ' ' + heightCls + ' ' + bgCls + ' ' + borderCls + ' ' +
        'flex flex-col items-center justify-center px-1.5 py-2 shrink-0 transition-all ' +
        (vacia ? 'cursor-default' : 'cursor-pointer hover:shadow-card-hover')
      }
    >
      <div className="font-mono text-[8px] font-bold uppercase tracking-industrial text-ink-400 mb-1">
        {bahiaId}
      </div>
      <div className="w-full text-center">
        <div className={'text-lg font-extrabold leading-none ' + (vacia ? 'text-ink-400' : 'text-ink-700 dark:text-ink-100')}>
          {n}
        </div>
        <div className="text-[7px] text-ink-400">{n === 1 ? 'OC' : 'OCs'}</div>
        {n > 0 && (
          <div className="text-[9px] text-ink-500 dark:text-ink-300 mt-0.5">
            {prepsAqui} prep.
          </div>
        )}
        {tiendaPrincipal && (
          <div className="text-[9px] text-ink-700 dark:text-ink-100 mt-1 leading-tight truncate w-full" title={tiendaPrincipal.nombre}>
            {tiendaPrincipal.nombre}
            {restantes > 0 && (
              <span className="text-ink-400"> +{restantes}</span>
            )}
          </div>
        )}
        {hasErr && (
          <div className="text-[8px] font-bold text-anomaly dark:text-anomaly-ring mt-0.5">
            {ocs.filter((o) => o.hasErr).length} err
          </div>
        )}
      </div>
      {!vacia && (
        <span className={'absolute w-2 h-2 rounded-full ' + dotCls} style={{ top: 6, right: 8 }} />
      )}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════
// EXPANDABLE PANEL
// ════════════════════════════════════════════════════════════════════

function PanelBahia({ titulo, ocs, numBahia, zona, onClose, onAbrirOC }) {
  if (!ocs || ocs.length === 0) {
    return (
      <div className={
        'mt-3.5 px-4 py-3 rounded-card border ' +
        'bg-white border-rfid/50 shadow-card-hover ' +
        'dark:bg-ink-700 dark:border-rfid/50 ' +
        'animate-[entrada-panel_.2s_ease]'
      }>
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-ink-400">Sin órdenes en {titulo}.</div>
          <CloseButton onClose={onClose} />
        </div>
      </div>
    );
  }

  // Para cada OC calculamos las tiendas destino que tienen prepacks
  // ESPECÍFICAMENTE en esta bahía + zona (no en otras bahías).
  // Esto le da al usuario el detalle de "esta OC manda 5 prepacks a Querétaro
  // y 2 a CDMX en esta bahía".
  function tiendasDeOcEnEstaBahia(oc) {
    const tagsZona = oc.tagsPorEtapa?.[zona] || [];
    const map = new Map();
    for (const t of tagsZona) {
      if (parseBahiaNumero(t.tienda?.bahia_asignada) !== numBahia) continue;
      const tid = t.tienda?.tienda_id || t.tienda_id || '—';
      if (!map.has(tid)) {
        map.set(tid, {
          tienda_id: tid,
          nombre: t.tienda?.nombre || tid,
          ciudad: t.tienda?.ciudad || null,
          count: 0,
        });
      }
      map.get(tid).count += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }

  const bahiaId = numBahia ? `B-${String(numBahia).padStart(2, '0')}` : null;

  return (
    <div className={
      'mt-3.5 px-4 py-3 rounded-card border shadow-card-hover ' +
      'bg-white border-rfid/50 ' +
      'dark:bg-ink-700 dark:border-rfid/50 ' +
      'animate-[entrada-panel_.2s_ease]'
    }>
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-[14px] font-bold text-ink-700 dark:text-ink-100">
            {titulo}
            {bahiaId && (
              <span className="ml-2 font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400">
                · {bahiaId}
              </span>
            )}
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5">
            {ocs.length} orden{ocs.length !== 1 ? 'es' : ''} de compra
          </div>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {ocs.map((oc) => {
          const tiendas = tiendasDeOcEnEstaBahia(oc);
          const prepsEnBahia = tiendas.reduce((s, t) => s + t.count, 0);
          return (
            <div
              key={oc.ordenId}
              onClick={() => onAbrirOC(oc, null)}
              className={
                'cursor-pointer rounded-card px-3.5 py-2.5 transition-all border ' +
                (oc.hasErr
                  ? 'bg-anomaly-bg/40 border-anomaly-ring/40 border-l-4 border-l-anomaly dark:bg-anomaly/15 dark:border-anomaly-ring/40 dark:border-l-anomaly-ring'
                  : 'bg-ink-50 border-ink-100 border-l-4 border-l-rfid hover:bg-rfid/5 dark:bg-ink-800 dark:border-ink-600 dark:border-l-rfid dark:hover:bg-rfid/10')
              }
            >
              <div className="text-[12px] font-semibold text-ink-700 dark:text-ink-100 mb-0.5 truncate">{oc.nombre}</div>
              <div className="font-mono text-[9px] text-ink-400 mb-1.5">
                {oc.ordenId} · {prepsEnBahia} prep. en esta bahía / {oc.totalPrepacks} total
              </div>

              {/* Tiendas destino dentro de esta bahía */}
              {tiendas.length > 0 && (
                <div className="mb-2">
                  <div className="font-mono text-[8px] font-bold uppercase tracking-industrial text-ink-400 mb-1">
                    Tiendas destino en {bahiaId || 'esta bahía'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tiendas.map((t) => (
                      <span
                        key={t.tienda_id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-rfid/30 text-rfid dark:bg-ink-700 dark:border-rfid/40 dark:text-blue-300"
                        title={t.ciudad ? `${t.nombre} — ${t.ciudad}` : t.nombre}
                      >
                        <span className="truncate max-w-[120px]">{t.nombre}</span>
                        <span className="font-mono text-ink-500 dark:text-ink-300">×{t.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <ProgressBar pct={oc.pct} hasErr={oc.hasErr} />
              <div className="text-[9px] text-ink-400 mt-1">{Math.round(oc.pct)}% procesado</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CloseButton({ onClose }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={
        'shrink-0 w-7 h-7 rounded flex items-center justify-center text-lg leading-none transition-colors ' +
        'text-ink-400 hover:bg-ink-50 ' +
        'dark:hover:bg-ink-600'
      }
      aria-label="Cerrar panel"
    >
      ×
    </button>
  );
}

function ProgressBar({ pct, hasErr }) {
  const clampedPct = Math.min(100, Math.round(pct || 0));
  return (
    <div className="h-1 bg-ink-100 dark:bg-ink-600 rounded overflow-hidden">
      <div
        className={'h-full transition-[width] duration-500 ' + (hasErr ? 'bg-anomaly dark:bg-anomaly-ring' : 'bg-rfid')}
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  );
}

function Panel({ children }) {
  return (
    <div className={
      'rounded-card border shadow-card overflow-hidden ' +
      'bg-white border-ink-100 ' +
      'dark:bg-ink-700 dark:border-ink-600'
    }>
      {children}
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.74-3.05M3 12a9 9 0 0 1 15.74-6.05M21 3v6h-6M3 21v-6h6" />
    </svg>
  );
}
