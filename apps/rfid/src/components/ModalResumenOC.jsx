import { useEffect } from 'react';
import {
  ETAPA_COLORS,
  ETAPA_LABELS,
  getColorCSS,
  esColorClaro,
} from '../data/etapas.js';
import { formatHora, formatDur, durMinutes } from '../utils/format.js';

const ETAPAS_ORDEN = ['PREREGISTRO', 'QA', 'REGISTRO', 'SORTER', 'BAHIA', 'AUDITORIA', 'ENVIO'];

/**
 * Summary modal for an OC — opened when the supervisor clicks the OC name
 * in the Gantt's left sticky column (vs ModalOC which opens from a stage
 * segment click and shows the full detail with prepack expansion).
 *
 * Sections:
 *   1. Header with product preview + active stages + color
 *   2. Per-stage cards in a horizontal scroll (1 card per stage)
 *   3. Reception validation (only if faltantes > 0)
 *   4. Flat prepacks table (no expansion, no nested modal)
 */
export function ModalResumenOC({ oc, onClose }) {
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

  const tags = oc.tags || [];
  const etapaLogs = oc.etapa_logs || [];
  const total = oc.totalPrepacks || tags.length;
  const esperados = oc.total_esperados || total;
  const faltantes = oc.faltantes || 0;
  const colorPrincipal = tags[0]?.color || '';
  const colorCSS = getColorCSS(colorPrincipal);
  const esClaro = esColorClaro(colorPrincipal);

  const nl = (oc.nombre || '').toLowerCase();
  const esPantalon = nl.includes('pantalon') || nl.includes('jean') || nl.includes('denim') ||
                     nl.includes('jogger') || nl.includes('chino') || nl.includes('short') ||
                     nl.includes('falda');

  /** Per-stage metrics object. */
  function getStageMetrics(eId) {
    const te = tags.filter((t) => t.etapa_actual === eId);
    const n = te.length;
    const err = te.filter((t) => t.qa_fallido).length;
    const log = etapaLogs.find((l) => l.etapa === eId);
    const enCurso = log && !log.timestamp_salida;
    const dur = durMinutes(log?.timestamp_entrada, log?.timestamp_salida);
    // If no tags currently at this stage, use prepacks_entrada from log
    const nEfectivo = n > 0 ? n : (log?.prepacks_entrada || 0);
    const pct = total > 0 ? Math.round((nEfectivo / total) * 100) : 0;
    const ok = nEfectivo - err;
    const pctOk = nEfectivo > 0
      ? Math.round((ok > 0 ? ok : nEfectivo - err) / nEfectivo * 100)
      : 100;
    return { n: nEfectivo, err, ok, pct, pctOk, log, enCurso, dur };
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[500] flex items-start justify-center overflow-auto p-7 bg-black/55"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          'w-full max-w-[860px] mb-8 rounded-[14px] shadow-[0_24px_64px_rgba(0,0,0,0.22)] ' +
          'bg-white animate-[entrada-modal_.22s_ease] ' +
          'dark:bg-ink-700'
        }
      >

        {/* ════════════ HEADER ════════════ */}
        <div className="flex gap-4 items-start px-6 py-5 border-b border-ink-100 dark:border-ink-600">
          {/* Product preview */}
          <div
            className="w-[72px] h-[72px] rounded-lg shrink-0 flex items-center justify-center shadow-card"
            style={{
              background: colorCSS,
              border: esClaro ? '2px solid #E2E8F0' : 'none',
            }}
          >
            <svg viewBox="0 0 32 32" width={48} height={48} fill="none">
              <path
                d={esPantalon
                  ? 'M10 8L14 8L19 26L16 26L16 18L16 26L13 26L18 8Z'
                  : 'M10 4L5 10L9 12L9 26L23 26L23 12L27 10L22 4C21 6 18.5 7.5 16 7.5C13.5 7.5 11 6 10 4Z'}
                fill={esClaro ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.22)'}
                stroke={esClaro ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)'}
                strokeWidth={1}
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            {/* Active stage pills */}
            <div className="flex gap-1.5 flex-wrap mb-2">
              {oc.etapasActivas?.map((e) => (
                <span
                  key={e}
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: `${ETAPA_COLORS[e]}1f`,
                    color: ETAPA_COLORS[e],
                    border: `1px solid ${ETAPA_COLORS[e]}55`,
                  }}
                >
                  {ETAPA_LABELS[e]}
                </span>
              ))}
              {oc.hasErr && (
                <span className="bg-anomaly-bg text-anomaly text-[9px] font-bold px-2 py-0.5 rounded-full dark:bg-anomaly/20 dark:text-anomaly-ring">
                  ⚠ Requiere atención
                </span>
              )}
            </div>

            <div className="font-display text-xl font-bold text-ink-700 dark:text-ink-100 mb-1">
              {oc.nombre}
            </div>
            <div className="text-[11px] text-ink-400">
              {oc.ordenId} · {oc.proveedor} · {total} prepacks
              {faltantes > 0 && (
                <span className="text-anomaly dark:text-anomaly-ring font-bold ml-1.5">
                  · {faltantes} faltantes
                </span>
              )}
            </div>

            {/* Color principal indicator */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{
                  background: colorCSS,
                  border: esClaro ? '1px solid #CBD5E1' : 'none',
                }}
              />
              <span className="text-[10px] text-ink-400">
                Color principal: <strong className="text-ink-700 dark:text-ink-100">{colorPrincipal || '—'}</strong>
              </span>
            </div>
          </div>

          {/* Close */}
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

        {/* ════════════ PER-STAGE CARDS ════════════ */}
        <div className="px-6 py-5 border-b border-ink-100 dark:border-ink-600">
          <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 mb-3.5">
            Recorrido completo — métricas por etapa
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ETAPAS_ORDEN.map((eId) => {
              const m = getStageMetrics(eId);
              if (m.n === 0 && !m.log && !oc.etapasActivas?.includes(eId)) return null;
              return (
                <StageCard
                  key={eId}
                  etapa={eId}
                  metrics={m}
                  total={total}
                />
              );
            })}
          </div>
        </div>

        {/* ════════════ RECEPTION VALIDATION ════════════ */}
        {faltantes > 0 && (
          <div className={
            'flex gap-5 items-center px-6 py-3.5 border-b border-l-4 ' +
            'bg-attention-bg border-ink-100 border-l-attention-ring ' +
            'dark:bg-attention/15 dark:border-ink-600 dark:border-l-attention-ring'
          }>
            <div className="text-[22px]">⚠</div>
            <div className="flex-1">
              <div className="text-[11px] font-bold text-attention dark:text-attention-ring mb-0.5">
                Validación de recepción
              </div>
              <div className="text-[11px] text-attention dark:text-attention-ring">
                Esperados: <strong>{esperados}</strong>. Llegaron: <strong>{total}</strong>.{' '}
                <strong className="text-anomaly dark:text-anomaly-ring">Faltan {faltantes}.</strong>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ PREPACKS TABLE ════════════ */}
        <div className="px-6 py-4">
          <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 mb-2.5">
            Prepacks ({tags.length})
          </div>
          <div className="overflow-x-auto rounded-card border border-ink-100 dark:border-ink-600">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-ink-50 dark:bg-ink-800">
                  {['Producto', 'Tienda', 'Bahía', 'Etapa', 'Estado'].map((h) => (
                    <th
                      key={h}
                      className="text-left font-mono text-[8px] font-bold uppercase tracking-industrial text-ink-400 px-2.5 py-1.5 border-b border-ink-100 dark:border-ink-600 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <PrepackSummaryRow key={tag.epc} tag={tag} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PER-STAGE CARD
// ════════════════════════════════════════════════════════════════════

function StageCard({ etapa, metrics, total }) {
  const color = ETAPA_COLORS[etapa];
  const { n, err, pct, pctOk, log, enCurso, dur } = metrics;

  return (
    <div
      className={
        'min-w-[120px] shrink-0 rounded-[10px] px-3 py-2.5 border ' +
        (enCurso
          ? 'bg-white dark:bg-ink-800/80'
          : 'bg-white dark:bg-ink-700')
      }
      style={{
        borderTop: `4px solid ${color}`,
        borderLeftColor: enCurso ? color : `${color}40`,
        borderRightColor: enCurso ? color : `${color}40`,
        borderBottomColor: enCurso ? color : `${color}40`,
        borderLeftWidth: '1.5px',
        borderRightWidth: '1.5px',
        borderBottomWidth: '1.5px',
        ...(enCurso && { background: `linear-gradient(${color}0c, transparent)` }),
      }}
    >
      <div
        className="font-mono text-[9px] font-bold uppercase tracking-industrial mb-1.5 flex items-center"
        style={{ color }}
      >
        {ETAPA_LABELS[etapa]}
        {enCurso && (
          <span className="ml-1 px-1 py-0 text-[8px] font-bold bg-flow-bg text-flow rounded dark:bg-flow/20 dark:text-flow-ring">
            EN CURSO
          </span>
        )}
      </div>

      <div className="text-[22px] font-extrabold leading-none mb-0.5" style={{ color }}>
        {pct}%
      </div>
      <div className="text-[10px] text-ink-400 mb-2">
        {n} de {total} prepacks
      </div>

      {(etapa === 'QA' || etapa === 'AUDITORIA') && (
        <div className="text-[9px] text-ink-500 dark:text-ink-300 mb-1.5">
          Calidad:{' '}
          <strong className={pctOk === 100 ? 'text-flow dark:text-flow-ring' : 'text-anomaly dark:text-anomaly-ring'}>
            {pctOk}%
          </strong>
          {err > 0 && (
            <span className="ml-1 text-anomaly dark:text-anomaly-ring">
              ({err} rech.)
            </span>
          )}
        </div>
      )}

      {log && (
        <div className="text-[8px] text-ink-400 leading-relaxed border-t border-ink-100 dark:border-ink-600 pt-1.5 mt-1">
          <div>
            <span className="font-semibold">Entró:</span> {formatHora(log.timestamp_entrada)}
          </div>
          {enCurso ? (
            <div className="text-flow dark:text-flow-ring font-semibold">En curso</div>
          ) : (
            <div>
              <span className="font-semibold">Salió:</span> {formatHora(log.timestamp_salida)}
            </div>
          )}
          {dur !== null && dur > 0 && (
            <div>
              <span className="font-semibold">Duración:</span> {formatDur(dur)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PREPACK ROW
// ════════════════════════════════════════════════════════════════════

function PrepackSummaryRow({ tag }) {
  const prendas = tag.prendas && tag.prendas.length > 0
    ? tag.prendas
    : [{ color: tag.color, talla: tag.talla }];
  const colores = [...new Set(prendas.map((p) => p.color))];
  const tallas = [...new Set(prendas.map((p) => p.talla))];
  const err = tag.qa_fallido;
  const etapaColor = ETAPA_COLORS[tag.etapa_actual] || '#94A3B8';

  return (
    <tr className={
      'border-b border-ink-100 dark:border-ink-600 ' +
      (err ? 'bg-anomaly-bg/50 dark:bg-anomaly/10' : '')
    }>
      {/* Product (color dots + sizes + count) */}
      <td className="px-2.5 py-1.5 font-semibold">
        <div className="flex items-center gap-1.5 flex-wrap">
          {colores.slice(0, 4).map((c) => (
            <span
              key={c}
              title={c}
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background: getColorCSS(c),
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
          ))}
          <span className="text-[10px] text-ink-700 dark:text-ink-100">
            {colores.join('/')} · {tallas.join(',')} · {prendas.length}p
          </span>
        </div>
      </td>

      {/* Store */}
      <td className="px-2.5 py-1.5">
        <div className="text-[11px] text-ink-700 dark:text-ink-100">
          {tag.tienda?.nombre || '—'}
        </div>
        {tag.tienda?.ciudad && (
          <div className="text-[9px] text-ink-400">{tag.tienda.ciudad}</div>
        )}
      </td>

      {/* Bay */}
      <td className="px-2.5 py-1.5 text-[10px] text-ink-400 whitespace-nowrap">
        {(tag.tienda?.bahia_asignada || '—').replace('BAHIA-', 'B-')}
      </td>

      {/* Stage pill */}
      <td className="px-2.5 py-1.5">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
          style={{
            background: `${etapaColor}1f`,
            color: etapaColor,
          }}
        >
          {ETAPA_LABELS[tag.etapa_actual] || tag.etapa_actual}
        </span>
      </td>

      {/* QA status */}
      <td className="px-2.5 py-1.5">
        {err ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap bg-anomaly-bg text-anomaly dark:bg-anomaly/20 dark:text-anomaly-ring">
            ✗ QA
          </span>
        ) : (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap bg-flow-bg text-flow dark:bg-flow/20 dark:text-flow-ring">
            ✓ OK
          </span>
        )}
      </td>
    </tr>
  );
}
