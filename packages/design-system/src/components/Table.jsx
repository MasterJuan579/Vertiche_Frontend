export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-card border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-800 transition-colors ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHeader({ children }) {
  return (
    <thead className="bg-ink-50 border-b border-ink-100 dark:bg-ink-900 dark:border-ink-800">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableRow({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-ink-100 last:border-b-0 dark:border-ink-800 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-ink-50/60 dark:hover:bg-ink-700/40' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  header = false,
  align = 'left',
  className = '',
}) {
  const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' }[align];
  if (header) {
    return (
      <th
        className={`px-4 py-3 ${alignClass} label-industrial text-ink-400 font-display dark:text-ink-300 ${className}`}
      >
        {children}
      </th>
    );
  }
  return (
    <td className={`px-4 py-3 ${alignClass} text-ink-700 dark:text-ink-100 transition-colors ${className}`}>
      {children}
    </td>
  );
}