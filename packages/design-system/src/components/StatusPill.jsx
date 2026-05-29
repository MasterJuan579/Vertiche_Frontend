const variants = {
  flow: 'bg-flow-bg text-flow border-flow/20',
  attention: 'bg-attention-bg text-attention border-attention/20',
  anomaly: 'bg-anomaly-bg text-anomaly border-anomaly/20',
  neutral: 'bg-ink-50 dark:bg-ink-600 text-ink-500 dark:text-ink-300 border-ink-200 dark:border-ink-500',
};

export function StatusPill({ status = 'neutral', children, icon, className = '' }) {
  const variant = variants[status] || variants.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill border text-xs font-display font-semibold uppercase tracking-industrial ${variant} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
