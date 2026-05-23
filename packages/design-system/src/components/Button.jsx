export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-display font-semibold rounded-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-ink-700 text-white hover:bg-ink-900',
    secondary: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50',
    ghost: 'bg-transparent text-ink-500 hover:text-ink-700 hover:bg-ink-50',
    danger: 'bg-anomaly text-white hover:bg-red-900',
    flow: 'bg-flow text-white hover:bg-green-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
