const STATUS_CLASS = {
  ok: 'bg-flow-bg text-flow-DEFAULT',
  warning: 'bg-attention-bg text-ink-900',
  critical: 'bg-anomaly-bg text-ink-900',
  idle: 'bg-ink-100 dark:bg-ink-600 text-ink-400 dark:text-ink-300',
};

export function StatusBadge({ status = 'idle', children }) {
  return (
    <span
      className={`inline-flex rounded-pill text-[10px] font-extrabold tracking-industrial uppercase px-2 py-[5px] ${
        STATUS_CLASS[status] ?? STATUS_CLASS.idle
      }`}
    >
      {children}
    </span>
  );
}
