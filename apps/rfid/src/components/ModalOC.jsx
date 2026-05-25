import { useState, useEffect } from 'react';
import {
  ETAPA_COLORS,
  ETAPA_LABELS,
  getColorCSS,
  esColorClaro,
} from '../data/demoOCs.js';
import { formatHora, formatDur, durMinutes } from '../utils/format.js';
import { consolidarHistorial } from '../utils/historial.js';
import { buildTablaPrepack } from '../utils/sizeTable.js';
import { MiniModalPrepack } from './MiniModalPrepack.jsx';

const ETAPAS_ORDEN = ['PREREGISTRO', 'QA', 'REGISTRO', 'SORTER', 'BAHIA', 'AUDITORIA', 'ENVIO'];
const ORDEN_TALLAS = ['XS', 'S', 'CH', 'M', 'G', 'L', 'XL', 'XXL', '25', '27', '28', '29', '30', '31', '32', '34', '36'];

/**
 * Full OC detail modal — the most complex modal in the project.
 *
 * Sections (top to bottom):
 *   1. Header — product preview SVG, name, current stages, "requires attention"
 *   2. Origin-stage metrics — only when opened from a Gantt segment click
 *   3. Color × size matrix — aggregated across all OK prepacks
 *   4. Reception validation — only when faltantes > 0
 *   5. Stage history timeline — consolidated logs from etapa_logs
 *   6. Bay distribution — pill list of bays this OC ships to
 *   7. Prepacks table — clickable rows that open MiniModalPrepack
 *
 * The mini-modal stacks on top via higher z-index — closing it doesn't
 * close the parent modal.
 */
export function ModalOC({ oc, etapaOrigen = null, onClose, onVerHistorial }) {
  const [prepackModal, setPrepackModal] = useState(null);

  // Escape key + body scroll lock.
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!oc) return null;

  // ─── Derived data ────────────────────────────────────────────────────
  const tags = oc.tags || [];
  const etapaLogs = oc.etapa_logs || [];
  const totalEsperados = oc.total_esperados || tags.length;
  const totalRecibidos = oc.total_recibidos || tags.length;
  const faltantes = oc.faltantes || 0;
  const etapasActuales = ETAPAS_ORDEN.filter((e) => tags.some((t) => t.etapa_actual === e));
  const fallidos = tags.filter((t) => t.qa_fallido);
  const tieneErr = fallidos.length > 0 || etapaLogs.some((l) => l.tiene_anomalia);

  const tagsFiltrados = etapaOrigen
    ? tags.filter((t) => t.etapa_actual === etapaOrigen)
    : tags;

  // Sort: errors first, then anomalies, then the rest.
  const tagsSorted = [...tagsFiltrados].sort((a, b) => {
    if (a.qa_fallido && !b.qa_fallido) return -1;
    if (!a.qa_fallido && b.qa_fallido) return 1;
    return 0;
  });

  // Aggregate color × size matrix from OK prepacks
  const tagsOk = tags.filter((t) => !t.qa_fallido);
  const todasPrendas = tagsOk.flatMap((t) =>
    t.prendas && t.prendas.length > 0 ? t.prendas : [{ color: t.color, talla: t.talla }]
  );
  const coloresAgr = [...new Set(todasPrendas.map((p) => p.color))].sort();
  const tallasAgr = [...new Set(todasPrendas.map((p) => p.talla))].sort((a, b) => {
    const ia = ORDEN_TALLAS.indexOf(a);
    const ib = ORDEN_TALLAS.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const conteoAgr = (c, t) => todasPrendas.filter((x) => x.color === c && x.talla === t).length;
  const totColorAgr = (c) => todasPrendas.filter((x) => x.color === c).length;
  const totTallaAgr = (t) => todasPrendas.filter((x) => x.talla === t).length;

  // Bays this OC distributes to
  const bahiasOC = Array.from({ length: 10 }, (_, i) => {
    const id = `BAHIA-${i + 1}`;
    const enB = tags.filter((t) => t.tienda?.bahia_asignada === id);
    return { n: i + 1, id, total: enB.length };
  }).filter((b) => b.total > 0);

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[500] flex items-start justify-center overflow-auto p-6 bg-black/55"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          'w-full max-w-[920px] mb-8 rounded-[14px] shadow-[0_24px_64px_rgba(0,0,0,0.22)] ' +
          'bg-white animate-[entrada-modal_.22s_ease] ' +
          'dark:bg-ink-700'
        }
      >

        {/* ════════════ HEADER ════════════ */}
        <Header
          oc={oc}
          tags={tags}
          totalEsperados={totalEsperados}
          totalRecibidos={totalRecibidos}
          faltantes={faltantes}
          etapasActuales={etapasActuales}
          tieneErr={tieneErr}
          onClose={onClose}
        />

        {/* ════════════ ORIGIN-STAGE METRICS ════════════ */}
        {etapaOrigen && (
          <OrigenMetrics
            etapaOrigen={etapaOrigen}
            tags={tags}
            totalEsperados={totalEsperados}
          />
        )}

        {/* ════════════ COLOR × SIZE MATRIX ════════════ */}
        <SectionWrap label="Contenido — tabla color × talla">
          {tagsOk.length === 0 ? (
            <div className="text-[13px] text-ink-400">Sin prepacks activos.</div>
          ) : (
            <ColorSizeTable
              colores={coloresAgr}
              tallas={tallasAgr}
              conteo={conteoAgr}
              totColor={totColorAgr}
              totTalla={totTallaAgr}
              gran={todasPrendas.length}
            />
          )}
          {fallidos.length > 0 && (
            <div className="mt-2 text-[11px] text-anomaly dark:text-anomaly-ring">
              ⚠ {fallidos.length} prepack{fallidos.length > 1 ? 's' : ''} excluido{fallidos.length > 1 ? 's' : ''} por QA.
            </div>
          )}
        </SectionWrap>

        {/* ════════════ RECEPTION VALIDATION ════════════ */}
        {faltantes > 0 && (
          <ReceptionValidation
            totalEsperados={totalEsperados}
            totalRecibidos={totalRecibidos}
            faltantes={faltantes}
          />
        )}

        {/* ════════════ STAGE HISTORY ════════════ */}
        {etapaLogs.length > 0 && (
          <SectionWrap label="Historial del cargamento">
            <StageHistory etapaLogs={etapaLogs} />
          </SectionWrap>
        )}

        {/* ════════════ BAY DISTRIBUTION ════════════ */}
        {bahiasOC.length > 0 && (
          <SectionWrap label="Distribución en bahías">
            <div className="flex gap-2 flex-wrap">
              {bahiasOC.map((b) => (
                <div
                  key={b.id}
                  className={
                    'rounded-card border min-w-[100px] px-3.5 py-2 ' +
                    'bg-rfid/5 border-rfid/30 border-l-4 border-l-rfid ' +
                    'dark:bg-rfid/15 dark:border-rfid/40 dark:border-l-rfid'
                  }
                >
                  <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-rfid dark:text-blue-300 mb-0.5">
                    Bahía {b.n}
                  </div>
                  <div className="text-lg font-bold text-ink-700 dark:text-ink-100 leading-none">
                    {b.total}
                  </div>
                  <div className="text-[9px] text-ink-400 mt-0.5">prepacks</div>
                </div>
              ))}
            </div>
          </SectionWrap>
        )}

        {/* ════════════ PREPACKS TABLE ════════════ */}
        <SectionWrap
          label={
            etapaOrigen
              ? `Prepacks en ${ETAPA_LABELS[etapaOrigen]} (${tagsFiltrados.length} de ${tags.length})`
              : `Prepacks (${tags.length})`
          }
          rightSlot={
            tagsFiltrados.filter((t) => t.qa_fallido).length > 0 && (
              <span className="ml-2 text-[10px] text-anomaly dark:text-anomaly-ring">
                · {tagsFiltrados.filter((t) => t.qa_fallido).length} rechazado{tagsFiltrados.filter((t) => t.qa_fallido).length !== 1 ? 's' : ''}
              </span>
            )
          }
          noBorder
        >
          <PrepacksTable
            tags={tagsSorted}
            onClickPrepack={setPrepackModal}
            onVerHistorial={onVerHistorial}
          />
        </SectionWrap>
      </div>

      {/* ════════════ MINI-MODAL ════════════ */}
      {prepackModal && (
        <MiniModalPrepack
          tag={prepackModal}
          onClose={() => setPrepackModal(null)}
          onVerHistorial={onVerHistorial}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// HEADER
// ════════════════════════════════════════════════════════════════════

function Header({ oc, tags, faltantes, etapasActuales, tieneErr, onClose }) {
  const colorP = (tags[0]?.color || '').toLowerCase();
  const sc = getColorCSS(colorP);
  const esC = esColorClaro(colorP);
  const nl = (oc.nombre || '').toLowerCase();
  const esPantalon = nl.includes('pantalon') || nl.includes('jean') || nl.includes('denim') || nl.includes('jogger') || nl.includes('chino') || nl.includes('short') || nl.includes('falda');

  return (
    <div className="flex items-start gap-4 px-6 py-5 border-b border-ink-100 dark:border-ink-600">
      {/* Product preview SVG */}
      <div
        className="w-[72px] h-[72px] rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: `${sc}1f`, border: esC ? '1px solid #E2E8F0' : 'none' }}
      >
        <svg viewBox="0 0 48 48" fill="none" width={42} height={42}>
          {esPantalon ? (
            <path
              d="M10 8L14 8L20 28L24 18L28 28L34 8L38 8L38 12L32 12L26 36L22 36L16 12L10 12Z"
              fill={sc} fillOpacity={0.85} stroke={sc} strokeWidth={1.5} strokeLinejoin="round"
            />
          ) : (
            <path
              d="M16 6L8 14L14 17L14 40L34 40L34 17L40 14L32 6C32 6 29 10 24 10C19 10 16 6 16 6Z"
              fill={sc} fillOpacity={0.85} stroke={sc} strokeWidth={1.5} strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        {/* Stage pills */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          {etapasActuales.length === 0 ? (
            <span className="bg-flow-bg text-flow text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Completado
            </span>
          ) : (
            etapasActuales.map((e) => (
              <span
                key={e}
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  background: `${ETAPA_COLORS[e]}1f`,
                  color: ETAPA_COLORS[e],
                  border: `1px solid ${ETAPA_COLORS[e]}55`,
                }}
              >
                {ETAPA_LABELS[e]}
              </span>
            ))
          )}
          {tieneErr && (
            <span className="bg-anomaly-bg text-anomaly text-[10px] font-bold px-2.5 py-0.5 rounded-full dark:bg-anomaly/20 dark:text-anomaly-ring">
              ⚠ Requiere atención
            </span>
          )}
        </div>

        {/* Name + meta */}
        <div className="font-display text-xl font-bold text-ink-700 dark:text-ink-100 mb-1">
          {oc.nombre}
        </div>
        <div className="text-[11px] text-ink-400">
          {oc.ordenId} · {oc.proveedor} · {tags.length} prepack{tags.length !== 1 ? 's' : ''}
          {faltantes > 0 && (
            <span className="text-anomaly dark:text-anomaly-ring font-bold ml-1.5">
              · {faltantes} faltante{faltantes !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className={
          'shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-lg leading-none transition-colors ' +
          'bg-white border border-ink-100 text-ink-400 hover:bg-ink-50 ' +
          'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-300 dark:hover:bg-ink-600'
        }
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// ORIGIN-STAGE METRICS — shown when opened from a Gantt segment click
// ════════════════════════════════════════════════════════════════════

const METRICAS_POR_ETAPA = {
  PREREGISTRO: [
    { l: 'Recibidos',    k: 'n',   d: 'prepacks llegaron' },
    { l: 'Esperados',    k: 'esp', d: 'según la OC' },
    { l: 'Recibido',     k: 'pct', d: 'del total esperado' },
  ],
  QA: [
    { l: 'En QA',        k: 'n',     d: 'prepacks revisados' },
    { l: 'Aprobados',    k: 'ok',    d: 'pasaron calidad' },
    { l: 'Calificación', k: 'pctOk', d: 'del proveedor' },
  ],
  REGISTRO: [
    { l: 'Registrados',  k: 'n',   d: 'en sistema' },
    { l: 'Total OC',     k: 'tot', d: 'prepacks totales' },
    { l: 'Avance',       k: 'pct', d: 'procesado' },
  ],
  SORTER: [
    { l: 'En Sorter',    k: 'n',   d: 'clasificando' },
    { l: 'Total',        k: 'tot', d: 'prepacks OC' },
    { l: 'Procesado',    k: 'pct', d: 'del cargamento' },
  ],
  BAHIA: [
    { l: 'En bahías',    k: 'n',   d: 'distribuidos' },
    { l: 'Total OC',     k: 'tot', d: 'prepacks' },
    { l: 'Distribuido',  k: 'pct', d: 'del total' },
  ],
  AUDITORIA: [
    { l: 'Auditados',    k: 'n',     d: 'prepacks' },
    { l: 'Aprobados',    k: 'ok',    d: 'pasaron' },
    { l: 'Aprobación',   k: 'pctOk', d: 'de calidad' },
  ],
  ENVIO: [
    { l: 'Enviados',     k: 'n',   d: 'prepacks' },
    { l: 'Total OC',     k: 'tot', d: 'prepacks' },
    { l: 'Completado',   k: 'pct', d: 'del pedido' },
  ],
};

function OrigenMetrics({ etapaOrigen, tags, totalEsperados }) {
  const c = ETAPA_COLORS[etapaOrigen] || '#6366F1';
  const te = tags.filter((t) => t.etapa_actual === etapaOrigen);
  const n = te.length;
  const tot = tags.length;
  const err = te.filter((t) => t.qa_fallido).length;
  const ok = n - err;
  const pct = tot > 0 ? Math.round((n / tot) * 100) : 0;
  const pctOk = n > 0 ? Math.round((ok / n) * 100) : 100;
  const valores = { n, tot, esp: totalEsperados, ok, pct: `${pct}%`, pctOk: `${pctOk}%` };
  const mets = METRICAS_POR_ETAPA[etapaOrigen] || [];

  return (
    <div
      className="px-6 py-4 border-b border-ink-100 dark:border-ink-600 border-l-4"
      style={{ background: `${c}10`, borderLeftColor: c }}
    >
      <div
        className="font-mono text-[9px] font-bold uppercase tracking-industrial mb-3"
        style={{ color: c }}
      >
        {ETAPA_LABELS[etapaOrigen]} — métricas de esta etapa
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {mets.map((m, i) => (
          <div
            key={i}
            className="rounded-card px-3.5 py-2.5 bg-white dark:bg-ink-700"
            style={{ border: `1px solid ${c}40` }}
          >
            <div
              className="font-mono text-[9px] font-bold uppercase tracking-industrial mb-1"
              style={{ color: c }}
            >
              {m.l}
            </div>
            <div className="text-[26px] font-extrabold text-ink-700 dark:text-ink-100 leading-none">
              {valores[m.k]}
            </div>
            <div className="text-[9px] text-ink-400 mt-0.5">{m.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION WRAPPER
// ════════════════════════════════════════════════════════════════════

function SectionWrap({ label, rightSlot, noBorder = false, children }) {
  return (
    <div className={'px-6 py-5 ' + (noBorder ? '' : 'border-b border-ink-100 dark:border-ink-600')}>
      <div className="flex items-center font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 mb-3">
        {label}
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// COLOR × SIZE TABLE
// ════════════════════════════════════════════════════════════════════

function ColorSizeTable({ colores, tallas, conteo, totColor, totTalla, gran }) {
  return (
    <div className="overflow-x-auto rounded-card border border-ink-100 dark:border-ink-600">
      <table className="border-collapse w-full min-w-[360px]">
        <thead>
          <tr>
            <th className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 text-left px-3.5 py-2 bg-ink-50 dark:bg-ink-800 border-b border-ink-100 dark:border-ink-600">
              Color
            </th>
            {tallas.map((t) => (
              <th
                key={t}
                className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 text-center px-3.5 py-2 bg-ink-50 dark:bg-ink-800 border-b border-ink-100 dark:border-ink-600"
              >
                {t}
              </th>
            ))}
            <th className="font-mono text-[9px] font-bold uppercase tracking-industrial text-center px-3.5 py-2 bg-rfid/15 text-rfid dark:bg-rfid/25 dark:text-blue-300 border-b border-ink-100 dark:border-ink-600">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {colores.map((color, idx) => (
            <tr key={color} className={idx % 2 === 0 ? '' : 'bg-ink-50/40 dark:bg-ink-800/40'}>
              <td className="px-3.5 py-2 text-[12px] font-semibold text-ink-700 dark:text-ink-100 border-b border-ink-100 dark:border-ink-600">
                {color}
              </td>
              {tallas.map((t) => {
                const n = conteo(color, t);
                return (
                  <td
                    key={t}
                    className={
                      'px-3.5 py-2 text-[12px] text-center border-b border-ink-100 dark:border-ink-600 ' +
                      (n > 0
                        ? 'font-bold text-ink-700 dark:text-ink-100'
                        : 'text-ink-200 dark:text-ink-500')
                    }
                  >
                    {n > 0 ? n : '—'}
                  </td>
                );
              })}
              <td className="px-3.5 py-2 text-[12px] text-center font-bold text-rfid dark:text-blue-300 bg-rfid/10 dark:bg-rfid/20 border-b border-ink-100 dark:border-ink-600">
                {totColor(color)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink-200 dark:border-ink-500">
            <td className="px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400">
              Total
            </td>
            {tallas.map((t) => (
              <td key={t} className="px-3.5 py-2 text-[13px] text-center font-extrabold text-ink-700 dark:text-ink-100">
                {totTalla(t)}
              </td>
            ))}
            <td className="px-3.5 py-2 text-base text-center font-extrabold text-white bg-rfid dark:bg-rfid">
              {gran}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// RECEPTION VALIDATION — only when faltantes > 0
// ════════════════════════════════════════════════════════════════════

function ReceptionValidation({ totalEsperados, totalRecibidos, faltantes }) {
  return (
    <div className={
      'px-6 py-4 border-b border-l-4 ' +
      'bg-attention-bg border-ink-100 border-l-attention-ring ' +
      'dark:bg-attention/15 dark:border-ink-600 dark:border-l-attention-ring'
    }>
      <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-attention dark:text-attention-ring mb-2.5">
        ⚠ Validación de recepción
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <ValidCard label="Esperados según OC" value={totalEsperados} variant="warning" />
        <ValidCard label="Recibidos"           value={totalRecibidos} variant="warning" />
        <ValidCard label="Faltantes"           value={faltantes}      variant="danger" />
      </div>
      <div className="text-[11px] text-attention dark:text-attention-ring">
        Se esperaban <strong>{totalEsperados}</strong> prepacks. Llegaron <strong>{totalRecibidos}</strong>. Faltan <strong className="text-anomaly dark:text-anomaly-ring">{faltantes}</strong>.
      </div>
    </div>
  );
}

function ValidCard({ label, value, variant }) {
  const isDanger = variant === 'danger';
  return (
    <div className={
      'rounded-card px-3.5 py-2.5 border ' +
      (isDanger
        ? 'bg-anomaly-bg border-anomaly-ring/40 dark:bg-anomaly/15 dark:border-anomaly-ring/50'
        : 'bg-white border-attention-ring/40 dark:bg-ink-700 dark:border-attention-ring/40')
    }>
      <div className={
        'font-mono text-[9px] font-bold uppercase tracking-industrial mb-1 ' +
        (isDanger
          ? 'text-anomaly dark:text-anomaly-ring'
          : 'text-attention dark:text-attention-ring')
      }>
        {label}
      </div>
      <div className={
        'text-[22px] font-extrabold ' +
        (isDanger
          ? 'text-anomaly dark:text-anomaly-ring'
          : 'text-ink-700 dark:text-ink-100')
      }>
        {value}
      </div>
      <div className={
        'text-[10px] ' +
        (isDanger ? 'text-anomaly dark:text-anomaly-ring' : 'text-ink-400')
      }>
        {isDanger ? 'no recibidos' : 'prepacks'}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// STAGE HISTORY — horizontal timeline of consolidated logs
// ════════════════════════════════════════════════════════════════════

function StageHistory({ etapaLogs }) {
  const logsC = consolidarHistorial(etapaLogs).filter((l) => l.etapa !== 'COMPLETADO');
  if (logsC.length === 0) {
    return <div className="text-[12px] text-ink-400">Sin historial registrado.</div>;
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-start gap-0 min-w-max">
        {logsC.map((log, idx) => {
          const color = ETAPA_COLORS[log.etapa] || '#94A3B8';
          const enCurso = !log.timestamp_salida;
          const dur = durMinutes(log.timestamp_entrada, log.timestamp_salida);
          const bajoPrepacks = log.prepacks_salida > 0 && log.prepacks_entrada !== log.prepacks_salida;

          return (
            <div key={log.etapa} className="flex items-start">
              {idx > 0 && (
                <div className="w-6 h-0.5 bg-ink-100 dark:bg-ink-600 mt-[19px] shrink-0" />
              )}
              <div className="w-[100px] text-center shrink-0">
                <div
                  className="w-[38px] h-[38px] rounded-full mx-auto mb-1.5 flex items-center justify-center text-sm font-bold"
                  style={{
                    background: enCurso ? color : `${color}1f`,
                    border: `2.5px solid ${color}`,
                    color: enCurso ? '#fff' : color,
                  }}
                >
                  {log.tiene_anomalia ? '⚠' : enCurso ? '●' : '✓'}
                </div>
                <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-700 dark:text-ink-100 mb-1">
                  {ETAPA_LABELS[log.etapa]}
                </div>
                <div className="text-[9px] text-ink-400 leading-snug">
                  <span className="font-semibold">Entró:</span> {formatHora(log.timestamp_entrada)}
                </div>
                {enCurso ? (
                  <div className="text-[9px] font-bold text-flow dark:text-flow-ring mt-0.5">
                    En curso
                  </div>
                ) : (
                  <div className="text-[9px] text-ink-400 leading-snug">
                    <span className="font-semibold">Salió:</span> {formatHora(log.timestamp_salida)}
                  </div>
                )}
                {dur !== null && dur > 0 && (
                  <div className="text-[9px] text-ink-400 mt-0.5">
                    Duración: {formatDur(dur)}
                  </div>
                )}
                {bajoPrepacks && (
                  <div className="inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-anomaly-bg text-anomaly dark:bg-anomaly/20 dark:text-anomaly-ring">
                    {log.prepacks_entrada}→{log.prepacks_salida} prep.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PREPACKS TABLE
// ════════════════════════════════════════════════════════════════════

function PrepacksTable({ tags, onClickPrepack }) {
  return (
    <div className="overflow-x-auto rounded-card border border-ink-100 dark:border-ink-600">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-ink-50 dark:bg-ink-800">
            {['# Código', 'Producto', 'Tienda destino', 'Bahía', 'Etapa', 'Estado', ''].map((h) => (
              <th
                key={h}
                className="text-left font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 px-3.5 py-2 border-b border-ink-100 dark:border-ink-600"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <PrepackRow key={tag.epc} tag={tag} onClick={() => onClickPrepack(tag)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PrepackRow({ tag, onClick }) {
  const prendas = tag.prendas && tag.prendas.length > 0
    ? tag.prendas
    : [{ color: tag.color, talla: tag.talla }];
  const tieneErr = tag.qa_fallido;
  const colUnicos = [...new Set(prendas.map((p) => p.color))];
  const tallUnicas = [...new Set(prendas.map((p) => p.talla))];
  const codigoCorto = tag.epc && tag.epc.length > 6 ? `···${tag.epc.slice(-6)}` : tag.epc;
  const entregado = ['ENVIO', 'COMPLETADO'].includes(tag.etapa_actual);
  const etapaColor = ETAPA_COLORS[tag.etapa_actual] || '#94A3B8';

  const rowBgCls = tieneErr
    ? 'bg-anomaly-bg/50 dark:bg-anomaly/10'
    : '';

  return (
    <tr className={
      'border-b border-ink-100 dark:border-ink-600 ' + rowBgCls
    }>
      {/* Code */}
      <td className="px-3.5 py-2 font-mono font-bold text-rfid dark:text-blue-300 whitespace-nowrap">
        {codigoCorto}
      </td>

      {/* Product (color swatches + sizes) */}
      <td className="px-3.5 py-2">
        <div className="text-[11px] font-semibold text-ink-700 dark:text-ink-100 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {colUnicos.map((c) => {
            const cCSS = getColorCSS(c);
            const eClC = esColorClaro(c);
            return (
              <span key={c} className="inline-flex items-center gap-1">
                <span
                  className="w-[7px] h-[7px] rounded-full shrink-0"
                  style={{
                    background: cCSS,
                    border: eClC ? '1px solid #CBD5E1' : 'none',
                  }}
                />
                {c}
              </span>
            );
          })}
        </div>
        <div className="text-[9px] text-ink-400 mt-0.5">
          {tallUnicas.join(', ')} · {prendas.length} prenda{prendas.length !== 1 ? 's' : ''}
        </div>
      </td>

      {/* Store */}
      <td className="px-3.5 py-2 text-[11px] text-ink-700 dark:text-ink-100">
        {tag.tienda?.nombre || '—'}
        {tag.tienda?.ciudad && (
          <div className="text-[10px] text-ink-400 mt-0.5">
            {tag.tienda.ciudad}{tag.tienda.estado ? `, ${tag.tienda.estado}` : ''}
          </div>
        )}
      </td>

      {/* Bay */}
      <td className="px-3.5 py-2 text-[11px] text-ink-400">
        {tag.tienda?.bahia_asignada || '—'}
      </td>

      {/* Stage pill */}
      <td className="px-3.5 py-2">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded"
          style={{
            background: `${etapaColor}1f`,
            color: etapaColor,
          }}
        >
          {ETAPA_LABELS[tag.etapa_actual] || tag.etapa_actual}
        </span>
      </td>

      {/* Status badges */}
      <td className="px-3.5 py-2">
        <div className="flex items-center gap-1 flex-nowrap">
          <StatusBadge active label="Pres." />
          <StatusBadge active={entregado} label={entregado ? 'Entg.' : 'Pend.'} neutral={!entregado} />
          <StatusBadge active={!tieneErr} label="QA" inverted={tieneErr} />
        </div>
      </td>

      {/* View detail button */}
      <td className="px-3.5 py-2">
        <button
          type="button"
          onClick={onClick}
          className={
            'px-2 py-0.5 rounded border text-[9px] font-bold transition-colors ' +
            'bg-white border-rfid/30 text-rfid hover:bg-rfid/10 ' +
            'dark:bg-ink-700 dark:border-rfid/40 dark:text-blue-300 dark:hover:bg-rfid/20'
          }
        >
          Ver detalle
        </button>
      </td>
    </tr>
  );
}

function StatusBadge({ active, label, neutral = false, inverted = false }) {
  const cls = inverted
    ? 'bg-anomaly-bg text-anomaly dark:bg-anomaly/20 dark:text-anomaly-ring'
    : neutral
      ? 'bg-ink-50 text-ink-400 dark:bg-ink-600 dark:text-ink-300'
      : active
        ? 'bg-flow-bg text-flow dark:bg-flow/20 dark:text-flow-ring'
        : 'bg-anomaly-bg text-anomaly dark:bg-anomaly/20 dark:text-anomaly-ring';

  const icon = inverted ? '✗' : active ? '✓' : '·';

  return (
    <span className={'text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ' + cls}>
      {icon} {label}
    </span>
  );
}
