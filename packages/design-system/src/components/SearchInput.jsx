export function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-ink-400 dark:text-ink-300">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 bg-white border border-ink-100 rounded-card text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:border-ink-300 dark:bg-ink-900 dark:border-ink-800 dark:text-white dark:placeholder-ink-400 dark:focus:border-ink-600 transition-colors"
      />
    </div>
  );
}