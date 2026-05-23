const colors = {
  flow: 'bg-flow-ring',
  attention: 'bg-attention-ring',
  anomaly: 'bg-anomaly-ring',
  idle: 'bg-ink-300',
};

const sizes = {
  sm: 'status-dot',
  md: 'status-dot-lg',
  lg: 'status-dot-xl',
};

export function StatusDot({ status = 'flow', size = 'md', pulse = false, className = '' }) {
  const colorClass = colors[status] || colors.flow;
  const sizeClass = sizes[size] || sizes.md;
  const pulseClass = pulse && status === 'flow' ? 'pulse-flow' : '';

  return <span className={`${sizeClass} ${colorClass} ${pulseClass} ${className}`} aria-hidden="true" />;
}
