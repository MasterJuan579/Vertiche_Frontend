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
      className={`relative bg-white dark:bg-ink-700 rounded-card shadow-card border border-ink-100 dark:border-ink-600 overflow-hidden ${
        onClick ? 'cursor-pointer hover:shadow-card-hover transition-shadow' : ''
      } ${className}`}
    >
      {accentBar}
      {children}
    </As>
  );
}

export function CardHeader({ children, label, action }) {
  return (
    <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4 border-b border-ink-100 dark:border-ink-600">
      <div>
        {label && (
          <div className="label-industrial text-ink-400 dark:text-ink-300 mb-1">{label}</div>
        )}
        {children && <div className="font-display font-semibold text-ink-700 dark:text-ink-100 text-lg">{children}</div>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
