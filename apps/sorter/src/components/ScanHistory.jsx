import { BAY_COLORS } from '../data/demoData.js';
import { IconWarning } from './Icons.jsx';

function fmtTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Right-side sidebar in SorterScreen. Lists recent scans, each item
 * shows the bay number swatch, EPC, product, store, and time.
 */
export function ScanHistory({ history, total, onClickItem }) {
  return (
    <aside className={
      'w-64 shrink-0 flex flex-col overflow-hidden ' +
      'bg-white border-l border-ink-100 ' +
      'dark:bg-ink-700 dark:border-ink-600'
    }>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-ink-100 dark:border-ink-600 shrink-0">
        <p className="font-mono text-[10px] uppercase tracking-industrial text-ink-400">
          Historial
        </p>
        <p className="mt-0.5 font-mono text-xl font-bold text-rfid dark:text-blue-300">
          {total}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 && (
          <div className="px-4 py-10 text-center text-[11px] text-ink-400">
            Sin escaneos aún
          </div>
        )}

        {history.map((s) => {
          const bayColor = BAY_COLORS[s.bayNumber] || '#6b7280';
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onClickItem?.(s)}
              className={
                'w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors ' +
                'border-b border-ink-100 dark:border-ink-600 ' +
                'hover:bg-ink-50 dark:hover:bg-ink-600'
              }
            >
              {/* Bay swatch */}
              <div
                className="shrink-0 mt-0.5 w-7 h-7 rounded-md flex items-center justify-center font-mono text-[11px] font-bold text-white"
                style={{ background: bayColor }}
              >
                {s.bayNumber}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-rfid dark:text-blue-300 truncate">
                    ···{s.epc?.slice(-6)}
                  </span>
                  <span className="font-mono text-[9px] text-ink-400 shrink-0">
                    {fmtTime(s.scannedAt)}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-ink-700 dark:text-ink-100 font-medium truncate">
                  {s.producto}
                </div>
                <div className="mt-0.5 text-[10px] text-ink-400 truncate">
                  {s.tienda?.nombre || s.storeName || '—'}
                </div>
                {s.isMisrouted && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-industrial text-anomaly dark:text-anomaly-ring">
                    <IconWarning size={10} color="currentColor" />
                    Misroute
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
