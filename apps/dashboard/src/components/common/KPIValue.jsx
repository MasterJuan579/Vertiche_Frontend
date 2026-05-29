import { formatNumber } from '../../utils/formatters';

export function KPIValue({ label, value, unit, status }) {
  return (
    <div className="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 rounded-card p-4">
      <span className="text-ink-400 dark:text-ink-300 text-[11px] font-extrabold tracking-industrial uppercase block">
        {label}
      </span>
      <div className="flex items-baseline gap-2 mt-2">
        <span
          className={`text-ink-700 dark:text-ink-100 font-display text-[30px] font-bold ${
            status === 'ok'
              ? 'text-flow-DEFAULT'
              : status === 'warning'
                ? 'text-attention-DEFAULT'
                : ''
          }`}
        >
          {typeof value === 'number' ? formatNumber(value) : value}
        </span>
        {unit && (
          <span className="text-ink-400 dark:text-ink-300 text-xs">{unit}</span>
        )}
      </div>
    </div>
  );
}
