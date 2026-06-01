import { useState, useEffect, useRef } from 'react';
import { ETAPAS_FLUJO, ETAPA_COLORS } from '../data/etapas.js';
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
 * Mapeo del enum DB `Tag.etapa_actual` al índice de su etapa más avanzada
 * en el orden del Gantt visual.
 *
 * Orden Gantt (índices): PREREGISTRO=0, QA=1, REGISTRO=2, SORTER=3, BAHIA=4, AUDITORIA=5, ENVIO=6
 *
 * Lógica acumulativa: si un tag está en EN_CAJA (índice 4 BAHIA), eso significa
 * que YA pasó por PRE-REGISTRO, QA y REGISTRO. Cuenta para todas las etapas
 * <= 4. Esto da el "X/Y prepacks que han llegado a esta etapa" correcto.
 */
const ETAPA_DB_A_INDICE_MAX = {
  REGISTRADO: 0, // llegó a PRE-REGISTRO
  EN_QA:      1, // pasó por PRE-REGISTRO y está en QA
  RECHAZADO:  1, // pasó por PRE-REGISTRO y QA (rechazado en QA)
  APROBADO:   2, // pasó por PRE-REGISTRO, QA y está en REGISTRO
  EN_CAJA:    4, // pasó por PRE-REGISTRO, QA, REGISTRO, SORTER y está en BAHIA
  ENVIADO:    6, // pasó por todo y salió
};

// Para retrocompatibilidad: la etapa visual "actual" del tag (donde está parado).
const ETAPA_DB_TO_GANTT = {
  REGISTRADO: 'PREREGISTRO',
  EN_QA:      'QA',
  APROBADO:   'REGISTRO',
  RECHAZADO:  'QA',
  EN_CAJA:    'BAHIA',
  ENVIADO:    'ENVIO',
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
    const bahiaId = `BAHIA-${numBahia}`;
    return ocsView.filter((oc) =>
      (oc.tagsPorEtapa?.[etapa] || []).some(
        (t) => t.tienda?.bahia_asignada === bahiaId
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
          <div className="text-xs text-ink-300 mt-2">Conectando con {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}</div>
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
            className="text-[10px] px-2 py-1 rounded bg-ink-50 hover:bg-ink-100 dark:bg-ink-600 dark:hover:bg-ink-500"
          >
            🔄 Actualizar
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

    // CONTEO ACUMULATIVO: por cada etapa visual, cuántos prepacks ya pasaron
    // por ahí (es decir, etapa_actual con índice >= etapa visual).
    // Si un tag está en EN_CAJA (índice 4 = BAHIA), cuenta para las etapas
    // 0, 1, 2, 3 y 4. Eso refleja el avance real.
    const llegadosPorEtapa = {};
    ETAPAS_FLUJO.forEach((etapa, idx) => {
      llegadosPorEtapa[etapa.id] = tagsDeOC.filter((t) => {
        const idxMaxTag = ETAPA_DB_A_INDICE_MAX[t.etapa_actual];
        return idxMaxTag != null && idxMaxTag >= idx;
      }).length;
    });

    // Para el rango visual (idxMin/idxMax) del Gantt
    const etapasConActividad = ETAPAS_FLUJO.map((e, i) => ({ id: e.id, idx: i }))
      .filter(({ id }) => llegadosPorEtapa[id] > 0);
    const idxMin = 0; // siempre desde PRE-REGISTRO
    const idxMax = etapasConActividad.length ? etapasConActividad[etapasConActividad.length - 1].idx : 0;

    const total_esperados = oc.total_esperados || tagsDeOC.length || 0;
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
      tagsPorEtapa,         // sigue siendo "los que están ahorita en esa etapa exacta" (para ModalOC)
      llegadosPorEtapa,     // NUEVO: acumulativo, los que ya pasaron por esa etapa
      etapasActivas: etapasConActividad.map((e) => e.id),
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
        const llegados = oc.llegadosPorEtapa?.[etapa.id] ?? 0;
        const total = oc.totalPrepacks || 0;
        const enEtapaActual = oc.tagsPorEtapa[etapa.id] || [];
        const errEnEtapa = enEtapaActual.some((t) => t.qa_fallido === true);
        const enRango = idx >= oc.idxMin && idx <= oc.idxMax;
        const color = ETAPA_COLORS[etapa.id] || '#94A3B8';

        return (
          <StageCell
            key={etapa.id}
            llegados={llegados}
            total={total}
            enRango={enRango}
            errEnEtapa={errEnEtapa}
            color={color}
            onClick={() => (llegados > 0 || enEtapaActual.length > 0) && onClickSegmento(oc, etapa.id)}
          />
        );
      })}
    </div>
  );
}

/**
 * Celda compacta de etapa. Muestra:
 *   - Vacía (sin tags llegados y fuera del rango activo de la OC).
 *   - Pendiente (en rango pero 0 llegados): línea punteada.
 *   - Parcial: "X/Y" + "NN%" con color de la etapa.
 *   - Completa (X == Y): verde sólido con ✓.
 *   - Anomalía: badge rojo encima.
 */
function StageCell({ llegados, total, enRango, errEnEtapa, color, onClick }) {
  const tienePrep = llegados > 0;
  const completo = total > 0 && llegados >= total;
  const pct = total > 0 ? Math.round((llegados / total) * 100) : 0;

  if (!tienePrep && !enRango) {
    return <div className="h-11 m-[3px_2px]" />;
  }

  if (!tienePrep && enRango) {
    return (
      <div className="h-11 m-[3px_2px] rounded-md flex items-center justify-center bg-ink-50/50 border border-dashed border-ink-100 dark:bg-ink-800/30 dark:border-ink-600">
        <div className="w-5 h-0.5 rounded bg-ink-200 dark:bg-ink-500" />
      </div>
    );
  }

  // Color del fondo según estado
  let bg, border, mainColor;
  if (errEnEtapa) {
    bg = 'rgba(239, 68, 68, 0.14)';
    border = '#FCA5A5';
    mainColor = '#DC2626';
  } else if (completo) {
    bg = 'rgba(34, 197, 94, 0.15)';
    border = '#86EFAC';
    mainColor = '#16A34A';
  } else {
    bg = `${color}1f`;
    border = `${color}66`;
    mainColor = color;
  }

  return (
    <div
      onClick={onClick}
      className="h-11 m-[3px_2px] rounded-md relative overflow-hidden cursor-pointer transition-all flex items-center justify-center px-1"
      style={{ background: bg, border: `1.5px solid ${border}` }}
      title={`${llegados} de ${total} prepacks han llegado a esta etapa (${pct}%)`}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = mainColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = border; }}
    >
      {/* Barra de progreso de fondo */}
      <div
        className="absolute left-0 top-0 bottom-0 pointer-events-none transition-[width]"
        style={{ width: `${pct}%`, background: `${mainColor}14` }}
      />

      {/* Contenido: X/Y grande + % chico */}
      <div className="relative z-[1] flex items-baseline gap-1.5 font-display">
        <div className="text-[15px] font-extrabold leading-none whitespace-nowrap" style={{ color: mainColor }}>
          {llegados}<span className="opacity-50">/{total}</span>
        </div>
        <div className="text-[10px] font-bold leading-none opacity-70" style={{ color: mainColor }}>
          {pct}%
        </div>
        {completo && !errEnEtapa && (
          <span className="text-[12px] font-bold leading-none" style={{ color: mainColor }}>✓</span>
        )}
      </div>

      {/* Badge anomalía */}
      {errEnEtapa && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-anomaly border-2 border-white animate-[pulse-rojo_1.4s_ease-in-out_infinite]" />
      )}
    </div>
  );
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

          return (
            <BayCell
              key={n}
              bahia={n}
              n={ocsB.length}
              hasErr={err}
              activa={activa}
              ocs={ocsB}
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

function BayCell({ bahia, n, hasErr, activa, ocs, shape, onClick }) {
  const vacia = n === 0;
  const sem = vacia ? 'gris' : hasErr ? 'rojo' : 'verde';

  const baseCls = shape === 'pill' ? 'rounded-full' : 'rounded-card';
  const widthCls = 'w-[90px]';
  const heightCls = 'min-h-[80px]';

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

  return (
    <button
      type="button"
      disabled={vacia}
      onClick={vacia ? undefined : onClick}
      className={
        baseCls + ' ' + widthCls + ' ' + heightCls + ' ' + bgCls + ' ' + borderCls + ' ' +
        'flex flex-col items-center justify-center px-1 py-2 shrink-0 transition-all ' +
        (vacia ? 'cursor-default' : 'cursor-pointer hover:shadow-card-hover')
      }
    >
      <div className="font-mono text-[7px] font-bold uppercase tracking-industrial text-ink-400 mb-1">
        B-{bahia}
      </div>
      <div className="w-full text-center">
        <div className={'text-lg font-extrabold leading-none ' + (vacia ? 'text-ink-400' : 'text-ink-700 dark:text-ink-100')}>
          {n}
        </div>
        <div className="text-[7px] text-ink-400 mb-1">OCs</div>
        {n > 0 && (
          <div className="text-[9px] text-ink-500 dark:text-ink-300">
            {ocs.reduce((s, o) => s + (o.totalPrepacks || 0), 0)} prep.
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

function PanelBahia({ titulo, ocs, onClose, onAbrirOC }) {
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

  return (
    <div className={
      'mt-3.5 px-4 py-3 rounded-card border shadow-card-hover ' +
      'bg-white border-rfid/50 ' +
      'dark:bg-ink-700 dark:border-rfid/50 ' +
      'animate-[entrada-panel_.2s_ease]'
    }>
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-[14px] font-bold text-ink-700 dark:text-ink-100">{titulo}</div>
          <div className="text-[11px] text-ink-400 mt-0.5">
            {ocs.length} orden{ocs.length !== 1 ? 'es' : ''} de compra
          </div>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <div className="flex gap-2.5 flex-wrap">
        {ocs.map((oc) => (
          <div
            key={oc.ordenId}
            onClick={() => onAbrirOC(oc, null)}
            className={
              'cursor-pointer rounded-card px-3.5 py-2.5 transition-all min-w-[180px] flex-1 border ' +
              (oc.hasErr
                ? 'bg-anomaly-bg/40 border-anomaly-ring/40 border-l-4 border-l-anomaly dark:bg-anomaly/15 dark:border-anomaly-ring/40 dark:border-l-anomaly-ring'
                : 'bg-ink-50 border-ink-100 border-l-4 border-l-rfid hover:bg-rfid/5 dark:bg-ink-800 dark:border-ink-600 dark:border-l-rfid dark:hover:bg-rfid/10')
            }
          >
            <div className="text-[12px] font-semibold text-ink-700 dark:text-ink-100 mb-0.5">{oc.nombre}</div>
            <div className="font-mono text-[9px] text-ink-400 mb-1.5">{oc.ordenId} · {oc.totalPrepacks} prepacks</div>
            <ProgressBar pct={oc.pct} hasErr={oc.hasErr} />
            <div className="text-[9px] text-ink-400 mt-1">{Math.round(oc.pct)}% procesado</div>
          </div>
        ))}
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
