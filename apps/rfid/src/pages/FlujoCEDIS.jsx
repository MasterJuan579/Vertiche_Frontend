import { useState, useEffect } from 'react';
import {
  DEMO_OCS,
  DEMO_KPI,
  ETAPAS_FLUJO,
  ETAPA_COLORS,
  cargarDatosReales,
} from '../data/demoOCs.js';
import { ModalOC } from '../components/ModalOC.jsx';
import { ModalResumenOC } from '../components/ModalResumenOC.jsx';

/**
 * Supervisor's home view. Three sections vertically:
 *
 *   1. BarraKPI    — top strip with "mejora vs manual" semaphore + 3 stats +
 *                    pause toggle. The pause is decorative without real data.
 *   2. Gantt       — sticky-left OC name column + 7 stage cells per OC row.
 *                    Click name → ModalResumenOC. Click stage cell → ModalOC.
 *   3. Bay grid    — 10 bays × 3 zones (Bahías / Auditoría / Envío). Click
 *                    any cell with OCs → expandable panel with the OC list.
 *
 * Con el backend conectado, useEffect carga datos reales cada 10 segundos.
 * Sin backend, usa datos mock de DEMO_OCS / DEMO_KPI.
 */

const ZONA_LABELS = {
  BAHIA:     'Bahías',
  AUDITORIA: 'Auditoría',
  ENVIO:     'Envío',
};

const ZONA_ACCENT = {
  BAHIA:     '#0891B2',
  AUDITORIA: '#DB2777',
  ENVIO:     '#16A34A',
};

export function FlujoCEDIS() {
  const [pausado, setPausado] = useState(false);
  const [panelBahia, setPanelBahia] = useState(null);
  const [ocModalOpen, setOcModalOpen] = useState(null);
  const [ocResumenOpen, setOcResumenOpen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [ocsData, setOcsData] = useState([]);
  const [kpiData, setKpiData] = useState(DEMO_KPI);

  // Cargar datos al inicio
  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => {
      if (!pausado) cargarDatos();
    }, 10000);
    return () => clearInterval(interval);
  }, [pausado]);

  async function cargarDatos() {
    try {
      setError(null);
      await cargarDatosReales();
      setOcsData([...DEMO_OCS]);
      setKpiData({ ...DEMO_KPI });
      console.log('✅ Datos cargados:', DEMO_OCS.length, 'órdenes');
    } catch (err) {
      console.error('Error cargando flujo:', err);
      setError('No se pudieron cargar los datos. Verifica que el backend esté corriendo en el puerto 3000');
    } finally {
      setCargando(false);
    }
  }

  // Usar los datos cargados dinámicamente
  const ocs = ocsData.filter((oc) => oc.etapasActivas?.length > 0);

  function ocsEnBahiaYEtapa(numBahia, etapa) {
    const bahiaId = `BAHIA-${numBahia}`;
    return ocs.filter((oc) =>
      (oc.tagsPorEtapa?.[etapa] || []).some(
        (t) => t.tienda?.bahia_asignada === bahiaId
      )
    );
  }

  const openModalDetalle = (oc, etapaOrigen) => {
    setOcModalOpen({ oc, etapaOrigen });
  };

  const openModalResumen = (oc) => {
    setOcResumenOpen(oc);
  };

  // Estado de carga
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl mb-2">📦</div>
          <div className="text-ink-400">Cargando flujo del CEDIS...</div>
          <div className="text-xs text-ink-300 mt-2">Conectando con http://localhost:3000</div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-anomaly">{error}</div>
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

      {/* ════════════ KPI BAR ════════════ */}
      <BarraKPI
        kpi={kpiData}
        pausado={pausado}
        onTogglePausa={() => setPausado((p) => !p)}
      />

      {/* ════════════ GANTT ════════════ */}
      <Panel>
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-ink-600 flex-wrap gap-2">
          <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 flex items-center gap-2">
            Flujo del CEDIS
            {pausado && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-flow-bg text-flow dark:bg-flow/20 dark:text-flow-ring">
                ⏸ Pausado
              </span>
            )}
            <span className="font-normal text-ink-400">— {ocs.length} OCs activas</span>
          </div>
          <button
            onClick={cargarDatos}
            className="text-[10px] px-2 py-1 rounded bg-ink-50 hover:bg-ink-100 dark:bg-ink-600 dark:hover:bg-ink-500"
          >
            🔄 Actualizar
          </button>
        </div>

        <div className="px-5 py-4">
          {ocs.length === 0 ? (
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
              ocs={ocs}
              onClickSegmento={openModalDetalle}
              onClickNombre={openModalResumen}
            />
          )}

          {/* ════════════ BAY GRID ════════════ */}
          {ocs.length > 0 && (
            <div className="border-t border-ink-100 dark:border-ink-600 pt-4 mt-6">
              <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 mb-3">
                Estado por bahía
              </div>

              {[
                { zona: 'BAHIA',     label: ZONA_LABELS.BAHIA,     color: ZONA_ACCENT.BAHIA },
                { zona: 'AUDITORIA', label: ZONA_LABELS.AUDITORIA, color: ZONA_ACCENT.AUDITORIA },
                { zona: 'ENVIO',     label: ZONA_LABELS.ENVIO,     color: ZONA_ACCENT.ENVIO },
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

      {/* ════════════ MODALS ════════════ */}
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
// KPI BAR
// ════════════════════════════════════════════════════════════════════

function BarraKPI({ kpi, pausado, onTogglePausa }) {
  const mejora = kpi?.mejora_porcentaje ?? null;
  const meta = kpi?.objetivo_mejora_pct || 32;
  const metaOk = mejora !== null && mejora >= meta;

  // Semaphore color
  const sem = mejora === null
    ? 'gris'
    : metaOk
      ? 'verde'
      : mejora >= 20
        ? 'amarillo'
        : 'rojo';

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
      {/* Main semaphore card */}
      <div className={
        'flex items-center gap-3 mr-5 px-4 py-2 rounded-card border-[1.5px] shrink-0 ' +
        semClass
      }>
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

      {/* Secondary stats */}
      {[
        { label: 'Ciclo promedio', value: cicloLabel,                         accent: 'text-ink-700 dark:text-ink-100' },
        { label: 'OCs activas',    value: kpi?.palets_activos ?? '—',         accent: 'text-ink-700 dark:text-ink-100' },
        { label: 'Completadas hoy', value: kpi?.palets_completados_hoy ?? '—', accent: 'text-flow dark:text-flow-ring' },
      ].map((s) => (
        <div key={s.label} className="mr-6 shrink-0">
          <div className={'text-[20px] font-extrabold leading-none ' + s.accent}>
            {s.value}
          </div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 mt-0.5">
            {s.label}
          </div>
        </div>
      ))}

      <div className="flex-1" />

      <div className="w-px h-8 bg-ink-100 dark:bg-ink-600 mr-3 shrink-0" />

      {/* Pause toggle */}
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
        {/* Header row */}
        <div
          className="grid mb-1"
          style={{ gridTemplateColumns: GANTT_COLS }}
        >
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

        {/* OC rows */}
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
      {/* Sticky-left OC name */}
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

      {/* Stage cells */}
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
  // Empty placeholder
  if (!tienePrep && !enRango) {
    return <div className="h-9 m-[3px_2px]" />;
  }

  // In-range but empty (dashed line)
  if (!tienePrep && enRango) {
    return (
      <div className="h-9 m-[3px_2px] rounded-md flex items-center justify-center bg-ink-50/50 border border-dashed border-ink-100 dark:bg-ink-800/30 dark:border-ink-600">
        <div className="w-5 h-0.5 rounded bg-ink-200 dark:bg-ink-500" />
      </div>
    );
  }

  // Active stage
  const pctWidth = Math.min(100, Math.round((tagsEnEtapaCount / totalPrepacks) * 100));
  const bg = errEnEtapa ? 'rgba(239, 68, 68, 0.12)' : `${color}1f`;
  const border = errEnEtapa ? '#FCA5A5' : `${color}66`;

  return (
    <div
      onClick={onClick}
      className="h-9 m-[3px_2px] rounded-md relative overflow-hidden cursor-pointer transition-all flex items-center justify-center"
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
      }}
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
      {/* Progress overlay */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-l-md pointer-events-none"
        style={{
          width: `${pctWidth}%`,
          background: `${color}10`,
        }}
      />

      {/* Stats row */}
      <div className="flex items-center w-full justify-around px-1.5 z-[1] relative">
        {datos.map((d, i) => (
          <div key={i} className="text-center flex-1">
            <div
              className="text-[13px] font-extrabold leading-none"
              style={{ color: errEnEtapa ? '#DC2626' : color }}
            >
              {d.v}
            </div>
            {d.l && (
              <div
                className="text-[7px] font-bold uppercase tracking-industrial mt-0.5 opacity-80 leading-tight"
                style={{ color: errEnEtapa ? '#991B1B' : color }}
              >
                {d.l}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Anomaly dot */}
      {errEnEtapa && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-anomaly border-2 border-white animate-[pulse-rojo_1.4s_ease-in-out_infinite]" />
      )}
    </div>
  );
}

/** Per-stage 3-value display data. */
function getDatosEtapa(etapaId, tagsEnEtapa, oc) {
  const total = oc.totalPrepacks;
  const n = tagsEnEtapa.length;
  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
  const err = tagsEnEtapa.filter((t) => t.qa_fallido).length;
  const ok = n - err;
  const pctOk = n > 0 ? Math.round((ok / n) * 100) : 100;
  const esp = oc.total_esperados || total;

  return ({
    PREREGISTRO: [{ l: 'recibidos',   v: n },  { l: 'esperados',  v: esp }, { l: '%',           v: `${pct}%` }],
    QA:          [{ l: 'revisados',   v: n },  { l: 'aprobados',  v: ok },  { l: 'calidad',     v: `${pctOk}%` }],
    REGISTRO:    [{ l: 'registrados', v: n },  { l: 'de',         v: total },{ l: 'avance',     v: `${pct}%` }],
    SORTER:      [{ l: 'clasificados',v: n },  { l: 'total',      v: total },{ l: 'procesado',  v: `${pct}%` }],
    BAHIA:       [{ l: 'en bahía',    v: n },  { l: 'total',      v: total },{ l: 'distribuido',v: `${pct}%` }],
    AUDITORIA:   [{ l: 'auditados',   v: n },  { l: 'aprobados',  v: ok },  { l: 'aprobación',  v: `${pctOk}%` }],
    ENVIO:       [{ l: 'enviados',    v: n },  { l: 'de',         v: total },{ l: 'completado', v: `${pct}%` }],
  })[etapaId] || [{ l: 'prepacks', v: n }, { l: '', v: '' }, { l: '%', v: `${pct}%` }];
}

// ════════════════════════════════════════════════════════════════════
// BAY GRID
// ════════════════════════════════════════════════════════════════════

function BayRow({ fila, ocsEnBahiaYEtapa, activeKey, onClickCell }) {
  return (
    <div className="flex items-center gap-0 mb-2">
      <div className="w-20 shrink-0 flex items-center justify-end pr-3">
        <span
          className="font-mono text-[9px] font-bold uppercase tracking-industrial"
          style={{ color: fila.color }}
        >
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

function BayCell({ bahia, n, hasErr, activa, ocs, shape, zonaColor, onClick }) {
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
    : vacia
      ? 'bg-ink-50 dark:bg-ink-800'
      : hasErr
        ? 'bg-anomaly-bg dark:bg-anomaly/15'
        : 'bg-white dark:bg-ink-700';

  const borderCls = activa
    ? 'border-rfid border-[2.5px]'
    : vacia
      ? 'border-ink-100 border-2 dark:border-ink-600'
      : hasErr
        ? 'border-anomaly-ring/40 border-2 dark:border-anomaly-ring/40'
        : 'border-ink-100 border-2 dark:border-ink-600';

  return (
    <button
      type="button"
      disabled={vacia}
      onClick={vacia ? undefined : onClick}
      className={
        baseCls + ' ' + widthCls + ' ' + heightCls + ' ' + bgCls + ' ' + borderCls + ' ' +
        'flex flex-col items-center justify-center px-1 py-2 shrink-0 transition-all ' +
        (vacia
          ? 'cursor-default'
          : 'cursor-pointer hover:shadow-card-hover')
      }
    >
      <div className="font-mono text-[7px] font-bold uppercase tracking-industrial text-ink-400 mb-1">
        B-{bahia}
      </div>
      <div className="w-full text-center">
        <div className={
          'text-lg font-extrabold leading-none ' +
          (vacia ? 'text-ink-400' : 'text-ink-700 dark:text-ink-100')
        }>
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
      {/* Status dot at top right */}
      {!vacia && (
        <span
          className={
            'absolute w-2 h-2 rounded-full ' + dotCls
          }
          style={{ top: 6, right: 8 }}
        />
      )}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════
// EXPANDABLE PANEL — appears below the bay grid when a cell is clicked
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
          <div className="text-[13px] text-ink-400">
            Sin órdenes en {titulo}.
          </div>
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
          <div className="text-[14px] font-bold text-ink-700 dark:text-ink-100">
            {titulo}
          </div>
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
            <div className="text-[12px] font-semibold text-ink-700 dark:text-ink-100 mb-0.5">
              {oc.nombre}
            </div>
            <div className="font-mono text-[9px] text-ink-400 mb-1.5">
              {oc.ordenId} · {oc.totalPrepacks} prepacks
            </div>
            <ProgressBar pct={oc.pct} hasErr={oc.hasErr} />
            <div className="text-[9px] text-ink-400 mt-1">
              {Math.round(oc.pct)}% procesado
            </div>
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
        className={
          'h-full transition-[width] duration-500 ' +
          (hasErr
            ? 'bg-anomaly dark:bg-anomaly-ring'
            : 'bg-rfid')
        }
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PANEL WRAPPER
// ════════════════════════════════════════════════════════════════════

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
