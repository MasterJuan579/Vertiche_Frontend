import { BAY_COLORS, getColorCSS, esColorClaro } from '../data/demoData.js';
import { buildTabla } from '../utils/sizeTable.js';
import { IconCheck, IconX } from './Icons.jsx';

/**
 * Vertical full-panel detail view. Used as the right sidebar in BayScreen.
 * Shows everything PrepackDetailBar shows but stacked vertically for the
 * narrow column.
 *
 * Includes an empty state so the panel still has presence when no prepack
 * is selected.
 */
export function PrepackDetailPanel({ prepack }) {
  // ──────────────── Empty state ────────────────
  if (!prepack) {
    return (
      <div className={
        'flex-1 flex flex-col items-center justify-center p-6 text-center ' +
        'bg-ink-50 border-l border-ink-100 ' +
        'dark:bg-ink-800 dark:border-ink-600'
      }>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-industrial text-ink-400">
          Detalle del prepack
        </div>
        <div className="text-xs text-ink-400">
          Selecciona un prepack para ver su contenido
        </div>
      </div>
    );
  }

  const prendas = prepack.prendas || [];
  const tabla = buildTabla(prendas);
  const bayColor = BAY_COLORS[prepack.bayNumber] || '#6b7280';

  return (
    <div className={
      'flex-1 overflow-y-auto p-4 space-y-3 ' +
      'bg-white border-l border-ink-100 ' +
      'dark:bg-ink-700 dark:border-ink-600'
    }>

      {/* ───── EPC header ───── */}
      <div className="pb-3 border-b border-ink-100 dark:border-ink-600">
        <div className="font-mono text-[10px] uppercase tracking-industrial text-ink-400 mb-0.5">
          EPC
        </div>
        <div
          className="font-mono text-lg font-bold"
          style={{ color: bayColor }}
        >
          {prepack.epc}
        </div>
      </div>

      {/* ───── Destino & order context ───── */}
      <PanelSection label="Destino">
        <div className="text-[13px] font-semibold text-ink-700 dark:text-ink-100">
          {prepack.tienda?.nombre || '—'}
        </div>
        <div className="text-[11px] text-ink-400 mt-0.5">
          {prepack.tienda?.ciudad || ''}{prepack.tienda?.estado ? ', ' + prepack.tienda.estado : ''}
        </div>
      </PanelSection>

      <PanelSection label="Orden">
        <div className="flex items-baseline gap-2">
          <span
            className="font-mono text-[13px] font-bold"
            style={{ color: bayColor }}
          >
            {prepack.orden_id}
          </span>
          <span className="text-[11px] text-ink-500 dark:text-ink-300 truncate">
            {prepack.producto || prepack.sku || '—'}
          </span>
        </div>
        <div className="text-[10px] text-ink-400 mt-0.5">
          {prepack.proveedor || '—'}
        </div>
      </PanelSection>

      {/* Status pills */}
      <div className="flex items-center gap-2">
        <FlowBadge tipoFlujo={prepack.tipo_flujo} />
        <QABadge qaFallido={prepack.qa_fallido} />
      </div>

      {/* ───── Composición ───── */}
      <div className="pt-3 border-t border-ink-100 dark:border-ink-600">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-industrial text-ink-400">
          Composición · {tabla.gran} prendas
        </div>
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
      </div>

      {/* ───── Size × color matrix ───── */}
      <div className="pt-3 border-t border-ink-100 dark:border-ink-600">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-industrial text-ink-400">
          Tallas × Colores
        </div>
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
              {/* Footer row: totals per size */}
              <tr className="border-t-2 border-ink-200 dark:border-ink-500">
                <td className="pr-2 py-1 font-mono text-[9px] uppercase tracking-industrial text-attention dark:text-attention-ring font-bold">
                  Σ
                </td>
                {tabla.tallas.map((t) => (
                  <td
                    key={t}
                    className="px-1 py-1 text-center font-mono font-bold text-attention dark:text-attention-ring"
                  >
                    {tabla.totTalla(t)}
                  </td>
                ))}
                <td className="pl-2 py-1 text-center font-mono font-bold text-attention dark:text-attention-ring">
                  {tabla.gran}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function PanelSection({ label, children }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-industrial text-ink-400 mb-1">
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
