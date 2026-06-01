import { useEffect } from 'react';
import { ETAPA_COLORS, ETAPA_LABELS, getColorCSS, esColorClaro } from '../data/etapas.js';
import { buildTablaPrepack } from '../utils/sizeTable.js';

/**
 * Nested modal — opens on top of ModalOC when the supervisor clicks
 * "Ver detalle" on a prepack row. Higher z-index keeps it above the
 * parent modal. Closing this one doesn't close the parent.
 *
 * Shows: code badge, dominant color swatch, per-prepack color×size table,
 * destination store + bay, and 3 status cards.
 */
export function MiniModalPrepack({ tag, onClose, onVerHistorial }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!tag) return null;

  const prendasMM = tag.prendas && tag.prendas.length > 0
    ? tag.prendas
    : [{ color: tag.color, talla: tag.talla }];
  const colUnicosMM = [...new Set(prendasMM.map((p) => p.color))];
  const tallUnicasMM = [...new Set(prendasMM.map((p) => p.talla))];
  const colorPrincipal = colUnicosMM[0] || tag.color || '';
  const cCSS = getColorCSS(colorPrincipal);
  const esC = esColorClaro(colorPrincipal);
  const txtC = esC ? '#1E293B' : '#FFFFFF';
  const codigo = tag.epc && tag.epc.length > 6 ? `···${tag.epc.slice(-6)}` : tag.epc;

  const entregado = ['ENVIO', 'COMPLETADO'].includes(tag.etapa_actual);
  const { colores, tallas, conteo, totColor, totTalla, gran } = buildTablaPrepack(tag);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[600] flex items-center justify-center p-5 bg-black/45"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          'w-full max-w-[620px] overflow-hidden rounded-[14px] shadow-[0_24px_64px_rgba(0,0,0,0.25)] ' +
          'bg-white animate-[entrada-modal_.2s_ease] ' +
          'dark:bg-ink-700'
        }
      >

        {/* ───── Header ───── */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-ink-100 dark:border-ink-600">
          {/* Garment preview */}
          <div
            className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center shadow-card"
            style={{
              background: cCSS,
              border: esC ? '2px solid #E2E8F0' : 'none',
            }}
          >
            <svg viewBox="0 0 32 32" width={36} height={36} fill="none">
              <path
                d="M10 4L5 10L9 12L9 26L23 26L23 12L27 10L22 4C21 6 18.5 7.5 16 7.5C13.5 7.5 11 6 10 4Z"
                fill={esC ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)'}
                stroke={esC ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)'}
                strokeWidth={1}
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={
                'font-mono text-[13px] font-extrabold px-2.5 py-0.5 rounded-md ' +
                'bg-rfid/15 border border-rfid/30 text-rfid ' +
                'dark:bg-rfid/25 dark:border-rfid/40 dark:text-blue-300'
              }>
                {codigo}
              </span>
              <span className="text-[9px] text-ink-400">código del prepack</span>
            </div>
            <div className="font-display text-lg font-extrabold text-ink-700 dark:text-ink-100 leading-tight mb-0.5">
              {prendasMM.length} prenda{prendasMM.length !== 1 ? 's' : ''} — {colUnicosMM.join(' / ')}
            </div>
            <div className="text-[10px] text-ink-400">
              {ETAPA_LABELS[tag.etapa_actual] || tag.etapa_actual} · {tag.tienda?.nombre || '—'}
            </div>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className={
              'shrink-0 w-[30px] h-[30px] rounded-md flex items-center justify-center text-base leading-none transition-colors ' +
              'bg-white border border-ink-100 text-ink-400 hover:bg-ink-50 ' +
              'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-300 dark:hover:bg-ink-600'
            }
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* ───── Body ───── */}
        <div className="px-5 py-4 space-y-4">

          {/* Color preview + summary */}
          <div className="flex gap-3">
            {colUnicosMM.length > 1 ? (
              <div className={
                'w-20 h-20 shrink-0 rounded-lg flex flex-wrap items-center justify-center gap-1 p-2 shadow-card ' +
                'bg-ink-50 border border-ink-100 ' +
                'dark:bg-ink-800 dark:border-ink-600'
              }>
                {colUnicosMM.slice(0, 4).map((c) => {
                  const cc = getColorCSS(c);
                  const ec = esColorClaro(c);
                  return (
                    <span
                      key={c}
                      title={c}
                      className="w-[26px] h-[26px] rounded-full shrink-0"
                      style={{
                        background: cc,
                        border: ec ? '1.5px solid #CBD5E1' : '1.5px solid rgba(0,0,0,0.1)',
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <div
                className="w-20 h-20 shrink-0 rounded-lg flex items-center justify-center shadow-card"
                style={{
                  background: cCSS,
                  border: esC ? '2px solid #E2E8F0' : 'none',
                }}
              >
                <span
                  className="text-[11px] font-bold text-center leading-tight"
                  style={{ color: txtC }}
                >
                  {colorPrincipal}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 flex-1">
              <MiniStat label="Colores" value={colUnicosMM.join(' / ')} />
              <MiniStat label="Tallas" value={tallUnicasMM.join(', ')} />
              <MiniStat label="Prendas" value={prendasMM.length} big />
              <MiniStat label="Tipo flujo" value={tag.tipo_flujo || '—'} dim />
            </div>
          </div>

          {/* Per-prepack color × size matrix */}
          <div>
            <SectionLabel>Contenido de este prepack</SectionLabel>
            <div className="rounded-card overflow-hidden border border-ink-100 dark:border-ink-600">
              <table className="border-collapse w-full text-[11px]">
                <thead>
                  <tr className="bg-ink-50 dark:bg-ink-800">
                    <th className="text-left font-mono text-[8px] font-bold uppercase tracking-industrial text-ink-400 px-2.5 py-1.5 border-b border-ink-100 dark:border-ink-600">
                      Color
                    </th>
                    {tallas.map((t) => (
                      <th
                        key={t}
                        className="text-center font-mono text-[8px] font-bold uppercase tracking-industrial text-ink-400 px-2.5 py-1.5 border-b border-ink-100 dark:border-ink-600"
                      >
                        {t}
                      </th>
                    ))}
                    <th className="text-center font-mono text-[8px] font-bold uppercase tracking-industrial px-2.5 py-1.5 bg-rfid/15 text-rfid dark:bg-rfid/25 dark:text-blue-300 border-b border-ink-100 dark:border-ink-600">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {colores.map((color, idx) => {
                    const cCol = getColorCSS(color);
                    const eClC = esColorClaro(color);
                    return (
                      <tr key={color} className={idx % 2 === 0 ? '' : 'bg-ink-50/40 dark:bg-ink-800/40'}>
                        <td className="px-2.5 py-1.5 font-semibold">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{
                                background: cCol,
                                border: eClC ? '1px solid #CBD5E1' : 'none',
                              }}
                            />
                            <span className="text-ink-700 dark:text-ink-100">{color}</span>
                          </span>
                        </td>
                        {tallas.map((t) => {
                          const n = conteo(color, t);
                          return (
                            <td
                              key={t}
                              className={
                                'px-2.5 py-1.5 text-center ' +
                                (n > 0
                                  ? 'font-bold text-ink-700 dark:text-ink-100'
                                  : 'text-ink-200 dark:text-ink-500')
                              }
                            >
                              {n > 0 ? n : '—'}
                            </td>
                          );
                        })}
                        <td className="px-2.5 py-1.5 text-center font-bold text-rfid dark:text-blue-300 bg-rfid/10 dark:bg-rfid/20">
                          {totColor(color)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-ink-200 dark:border-ink-500">
                    <td className="px-2.5 py-1.5 font-mono text-[8px] font-bold uppercase tracking-industrial text-ink-400">
                      Total
                    </td>
                    {tallas.map((t) => (
                      <td key={t} className="px-2.5 py-1.5 text-center font-extrabold text-[12px] text-ink-700 dark:text-ink-100">
                        {totTalla(t)}
                      </td>
                    ))}
                    <td className="px-2.5 py-1.5 text-center font-extrabold text-[15px] text-white bg-rfid">
                      {gran}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Destination store */}
          <div>
            <SectionLabel>Tienda destino</SectionLabel>
            <div className={
              'rounded-card px-3.5 py-2.5 flex gap-4 items-center ' +
              'bg-ink-50 border border-ink-100 ' +
              'dark:bg-ink-800 dark:border-ink-600'
            }>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-ink-700 dark:text-ink-100">
                  {tag.tienda?.nombre || '—'}
                </div>
                {(tag.tienda?.ciudad || tag.tienda?.estado) && (
                  <div className="text-[10px] text-ink-400 mt-0.5">
                    {[tag.tienda?.ciudad, tag.tienda?.estado].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="font-mono text-[9px] uppercase tracking-industrial text-ink-400 mb-0.5">
                  Bahía
                </div>
                <div className="text-sm font-extrabold text-rfid dark:text-blue-300">
                  {(tag.tienda?.bahia_asignada || '—').replace('BAHIA-', 'B-')}
                </div>
              </div>
            </div>
          </div>

          {/* Status cards */}
          <div>
            <SectionLabel>Estatus</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              <StatusCard
                ok={!tag.qa_fallido}
                title={tag.qa_fallido ? 'QA Falló' : 'Calidad OK'}
                subtitle={tag.qa_fallido ? tag.qa_motivo_fallo || 'Sin motivo' : null}
              />
              <StatusCard
                ok={entregado}
                neutral={!entregado}
                title={entregado ? 'Entregado' : 'Pendiente'}
              />
              <StageCurrentCard etapa={tag.etapa_actual} />
            </div>
          </div>

          {/* Footer EPC + history link */}
          <div className="flex items-center justify-between pt-2 border-t border-ink-100 dark:border-ink-600">
            <div className="text-[9px] text-ink-400">
              EPC:{' '}
              <code className="font-mono text-ink-400">{tag.epc}</code>
            </div>
            {onVerHistorial && (
              <button
                type="button"
                onClick={() => onVerHistorial(tag.epc)}
                className={
                  'px-3 py-1 rounded text-[10px] font-bold uppercase tracking-industrial transition-colors ' +
                  'bg-rfid text-white hover:bg-blue-700 ' +
                  'dark:hover:bg-blue-600'
                }
              >
                Ver historial completo →
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════════════════════════════

function SectionLabel({ children }) {
  return (
    <div className="font-mono text-[8px] font-bold uppercase tracking-industrial text-ink-400 mb-2">
      {children}
    </div>
  );
}

function MiniStat({ label, value, big = false, dim = false }) {
  return (
    <div>
      <div className="font-mono text-[8px] font-bold uppercase tracking-industrial text-ink-400 mb-0.5">
        {label}
      </div>
      <div className={
        (big
          ? 'text-[13px] font-bold text-ink-700 dark:text-ink-100'
          : dim
            ? 'text-[11px] text-ink-500 dark:text-ink-300'
            : 'text-[12px] font-bold text-ink-700 dark:text-ink-100')
      }>
        {value}
      </div>
    </div>
  );
}

function StatusCard({ ok, neutral = false, title, subtitle }) {
  const cls = neutral
    ? 'bg-ink-50 border-ink-100 dark:bg-ink-800 dark:border-ink-600'
    : ok
      ? 'bg-flow-bg border-flow-ring/40 dark:bg-flow/20 dark:border-flow-ring/40'
      : 'bg-anomaly-bg border-anomaly-ring/40 dark:bg-anomaly/20 dark:border-anomaly-ring/50';

  const textCls = neutral
    ? 'text-ink-400'
    : ok
      ? 'text-flow dark:text-flow-ring'
      : 'text-anomaly dark:text-anomaly-ring';

  return (
    <div className={'flex-1 px-3 py-2 rounded-card border text-center ' + cls}>
      <div className="text-base mb-0.5">{neutral ? '·' : ok ? '✓' : '✗'}</div>
      <div className={'text-[10px] font-bold ' + textCls}>{title}</div>
      {subtitle && (
        <div className={'text-[8px] mt-1 ' + textCls}>{subtitle}</div>
      )}
    </div>
  );
}

function StageCurrentCard({ etapa }) {
  const color = ETAPA_COLORS[etapa] || '#94A3B8';
  return (
    <div className={
      'flex-1 px-3 py-2 rounded-card border text-center ' +
      'bg-ink-50 border-ink-100 ' +
      'dark:bg-ink-800 dark:border-ink-600'
    }>
      <div className="text-sm font-extrabold mb-0.5" style={{ color }}>
        {ETAPA_LABELS[etapa] || etapa}
      </div>
      <div className="text-[9px] text-ink-400">etapa actual</div>
    </div>
  );
}
