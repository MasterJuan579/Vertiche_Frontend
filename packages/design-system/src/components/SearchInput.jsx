export function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 dark:text-ink-400 text-sm">
        ⌕
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-500 rounded-card text-sm text-ink-700 dark:text-ink-100 placeholder-ink-300 dark:placeholder-ink-500 focus:outline-none focus:border-ink-400 dark:focus:border-ink-300 focus:ring-2 focus:ring-ink-100 dark:focus:ring-ink-700"
      />
    </div>
  );
}
