import { BAY_COLORS, getColorCSS, esColorClaro } from '../data/demoData.js';
import { buildTabla } from '../utils/sizeTable.js';
import { IconCheck, IconX } from './Icons.jsx';

/**
 * Horizontal detail strip shown below the bay number circle in SorterScreen.
 * Three columns side-by-side:
 *   1. Store / order context
 *   2. Garment composition (color swatches + counts)
 *   3. Size × color matrix
 *
 * Designed to fit roughly 950px wide; on narrow viewports it falls back to
 * stacked columns via Tailwind's responsive grid.
 */
export function PrepackDetailBar({ prepack }) {
  if (!prepack) return null;

  const prendas = prepack.prendas || [];
  const tabla = buildTabla(prendas);
  const bayColor = BAY_COLORS[prepack.bayNumber] || '#6b7280';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-3 w-full max-w-[950px]">

      {/* ───── Column 1 — Store / order context ───── */}
      <DetailCard label="Destino & Orden">
        <div className="space-y-2.5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-industrial text-ink-400">
              Tienda
            </div>
            <div className="text-[13px] font-semibold text-ink-700 dark:text-ink-100 truncate">
              {prepack.tienda?.nombre || '—'}
            </div>
            <div className="text-[10px] text-ink-400">
              {prepack.tienda?.ciudad || ''}{prepack.tienda?.estado ? ', ' + prepack.tienda.estado : ''}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-industrial text-ink-400">
                Orden
              </div>
              <div
                className="font-mono text-xs font-bold"
                style={{ color: bayColor }}
              >
                {prepack.orden_id}
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-industrial text-ink-400">
                Producto
              </div>
              <div className="text-[11px] font-medium text-ink-700 dark:text-ink-100 truncate">
                {prepack.producto}
              </div>
            </div>
          </div>

          <div>
            <div className="font-mono text-[9px] uppercase tracking-industrial text-ink-400">
              Proveedor
            </div>
            <div className="text-[11px] text-ink-500 dark:text-ink-300 truncate">
              {prepack.proveedor || '—'}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <FlowBadge tipoFlujo={prepack.tipo_flujo} />
            <QABadge qaFallido={prepack.qa_fallido} />
          </div>
        </div>
      </DetailCard>

      {/* ───── Column 2 — Garment composition ───── */}
      <DetailCard label="Composición">
        <div className="space-y-1.5">
          {tabla.colores.map((color) => {
            const colorCSS = getColorCSS(color);
            const light = esColorClaro(color);
            return (
              <div key={color} className="flex items-center gap-2">
                <span
                  className={
                    'w-3.5 h-3.5 rounded-full shrink-0 border ' +
                    (light ? 'border-ink-200' : 'border-white/10')
                  }
                  style={{ background: colorCSS }}
                />
                <span className="flex-1 text-[12px] text-ink-700 dark:text-ink-100 truncate">
                  {color}
                </span>
                <span className="font-mono text-[12px] font-bold text-ink-700 dark:text-ink-100">
                  {tabla.totColor(color)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-2 border-t border-ink-100 dark:border-ink-600 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-industrial text-ink-400">
            Total
          </span>
          <span
            className="font-mono text-lg font-bold"
            style={{ color: bayColor }}
          >
            {tabla.gran}
          </span>
        </div>
      </DetailCard>

      {/* ───── Column 3 — Size × color matrix ───── */}
      <DetailCard label="Tallas × Colores">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr>
                <th className="text-left pr-2 font-mono text-[9px] uppercase tracking-industrial text-ink-400 font-medium">
                  Color
                </th>
                {tabla.tallas.map((t) => (
                  <th
                    key={t}
                    className="px-1 font-mono text-[9px] uppercase tracking-industrial text-ink-400 font-medium text-center"
                  >
                    {t}
                  </th>
                ))}
                <th className="pl-2 font-mono text-[9px] uppercase tracking-industrial text-attention dark:text-attention-ring font-bold text-center">
                  Σ
                </th>
              </tr>
            </thead>
            <tbody>
              {tabla.colores.map((c) => (
                <tr key={c} className="border-t border-ink-100 dark:border-ink-600">
                  <td className="pr-2 py-1 truncate text-ink-700 dark:text-ink-100 max-w-[80px]">
                    {c}
                  </td>
                  {tabla.tallas.map((t) => {
                    const n = tabla.conteo(c, t);
                    return (
                      <td
                        key={t}
                        className={
                          'px-1 py-1 text-center font-mono ' +
                          (n > 0
                            ? 'text-ink-700 dark:text-ink-100 font-semibold'
                            : 'text-ink-200 dark:text-ink-600')
                        }
                      >
                        {n > 0 ? n : '·'}
                      </td>
                    );
                  })}
                  <td className="pl-2 py-1 text-center font-mono font-bold text-attention dark:text-attention-ring">
                    {tabla.totColor(c)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailCard>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function DetailCard({ label, children }) {
  return (
    <div className={
      'p-3 rounded-card border border-ink-100 shadow-card ' +
      'bg-white dark:bg-ink-700 dark:border-ink-600'
    }>
      <div className="mb-2 font-mono text-[9px] uppercase tracking-industrial text-ink-400 font-medium">
        {label}
      </div>
      {children}
    </div>
  );
}

function FlowBadge({ tipoFlujo }) {
  if (!tipoFlujo) return null;
  const isCrossDock = tipoFlujo === 'CROSS_DOCK';
  return (
    <span className={
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ' +
      (isCrossDock
        ? 'bg-blue-50 text-rfid border border-rfid/30 dark:bg-rfid/20 dark:text-blue-300 dark:border-rfid/40'
        : 'bg-ink-50 text-ink-500 border border-ink-100 dark:bg-ink-600 dark:text-ink-300 dark:border-ink-500')
    }>
      {tipoFlujo}
    </span>
  );
}

function QABadge({ qaFallido }) {
  if (qaFallido) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-anomaly-bg text-anomaly border border-anomaly-ring/40 dark:bg-anomaly/20 dark:text-anomaly-ring dark:border-anomaly-ring/50">
        <IconX size={10} color="currentColor" /> QA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-flow-bg text-flow border border-flow-ring/40 dark:bg-flow/20 dark:text-flow-ring dark:border-flow-ring/50">
      <IconCheck size={10} color="currentColor" /> QA OK
    </span>
  );
}
