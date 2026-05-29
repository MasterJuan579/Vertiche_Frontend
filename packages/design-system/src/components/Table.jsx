export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-card border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-700 ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHeader({ children }) {
  return (
    <thead className="bg-ink-50 dark:bg-ink-600 border-b border-ink-100 dark:border-ink-600">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableRow({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-ink-100 dark:border-ink-600 last:border-b-0 ${
        onClick ? 'cursor-pointer hover:bg-ink-50/60 dark:hover:bg-ink-600/60' : ''
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
        className={`px-4 py-3 ${alignClass} label-industrial text-ink-400 dark:text-ink-300 font-display ${className}`}
      >
        {children}
      </th>
    );
  }
  return (
    <td className={`px-4 py-3 ${alignClass} text-ink-700 dark:text-ink-100 ${className}`}>
      {children}
    </td>
  );
}
