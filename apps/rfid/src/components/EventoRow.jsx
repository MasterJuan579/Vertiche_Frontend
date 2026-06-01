import { formatHora, epcCorto } from '../utils/format.js';
import { ETAPA_COLORS, ETAPA_LABELS } from '../data/etapas.js';

/**
 * One row in the Bitácora event stream. Five columns:
 *   1. Time (HH:mm)
 *   2. EPC (clickable → Trazabilidad)
 *   3. Reader ID
 *   4. Stage pill (color-coded)
 *   5. Status (OK / DUP)
 *
 * Alternating row striping handled by parent via the `striped` prop.
 */
export function EventoRow({ evento, striped = false, onClickEpc }) {
  if (!evento) return null;

  const isDup = !!evento.es_duplicado;
  const etapaColor = ETAPA_COLORS[evento.etapa] || '#94A3B8';
  const etapaLabel = ETAPA_LABELS[evento.etapa] || evento.etapa;

  return (
    <div className={
      'grid grid-cols-[80px_1fr_120px_110px_60px] gap-2 items-center px-3 py-2 ' +
      'font-mono text-[12px] border-b border-ink-100 dark:border-ink-600 ' +
      (striped
        ? 'bg-ink-50/50 dark:bg-ink-700/30'
        : 'bg-white dark:bg-ink-700')
    }>
      {/* Time */}
      <span className="text-ink-500 dark:text-ink-300 tabular-nums">
        {formatHora(evento.tiempo)}
      </span>

      {/* EPC — clickable if onClickEpc provided */}
      <button
        type="button"
        onClick={() => onClickEpc?.(evento.epc)}
        disabled={!onClickEpc}
        title={evento.epc}
        className={
          'min-w-0 text-left truncate font-bold transition-colors ' +
          (onClickEpc
            ? 'text-rfid dark:text-blue-300 hover:underline cursor-pointer'
            : 'text-ink-700 dark:text-ink-100 cursor-default')
        }
      >
        {epcCorto(evento.epc)}
      </button>

      {/* Reader ID */}
      <span className="text-[10px] text-ink-400 truncate">
        {evento.lector || '—'}
      </span>

      {/* Stage pill */}
      <span
        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-industrial text-center truncate"
        style={{
          background: `${etapaColor}1f`,
          color: etapaColor,
          border: `1px solid ${etapaColor}55`,
        }}
      >
        {etapaLabel}
      </span>

      {/* Status */}
      <span className={
        'text-[10px] font-bold text-center px-1.5 py-0.5 rounded ' +
        (isDup
          ? 'bg-anomaly-bg text-anomaly dark:bg-anomaly/20 dark:text-anomaly-ring'
          : 'bg-flow-bg text-flow dark:bg-flow/20 dark:text-flow-ring')
      }>
        {isDup ? 'DUP' : 'OK'}
      </span>
    </div>
  );
}
