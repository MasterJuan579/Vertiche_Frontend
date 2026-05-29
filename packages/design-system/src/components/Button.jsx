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
    primary: 'bg-ink-700 text-white hover:bg-ink-900 dark:bg-ink-600 dark:hover:bg-ink-500',
    secondary: 'bg-white dark:bg-ink-700 text-ink-700 dark:text-ink-100 border border-ink-200 dark:border-ink-500 hover:bg-ink-50 dark:hover:bg-ink-600',
    ghost: 'bg-transparent text-ink-500 dark:text-ink-300 hover:text-ink-700 dark:hover:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-600',
    danger: 'bg-anomaly text-white hover:bg-red-900 dark:hover:bg-red-800',
    flow: 'bg-flow text-white hover:bg-green-800 dark:hover:bg-green-700',
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
