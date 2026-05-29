export function Card({ children, className = '', accent, onClick, as: As = 'div' }) {
  const accentBar = accent ? (
    <div
      className="absolute top-0 left-0 right-0 h-[3px]"
      style={{ background: accent }}
    />
  ) : null;

  return (
    <As
      onClick={onClick}
      className={`relative bg-white rounded-card shadow-card border border-ink-100 overflow-hidden dark:bg-ink-800 dark:border-ink-800 dark:shadow-none transition-all ${
        onClick ? 'cursor-pointer hover:shadow-card-hover dark:hover:bg-ink-700/50' : ''
      } ${className}`}
    >
      {accentBar}
      {children}
    </As>
  );
}

export function CardHeader({ children, label, action }) {
  return (
    <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4 border-b border-ink-100 dark:border-ink-800">
      <div>
        {label && (
          <div className="label-industrial text-ink-400 mb-1 dark:text-ink-300">{label}</div>
        )}
        {children && <div className="font-display font-semibold text-ink-700 text-lg dark:text-white">{children}</div>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}