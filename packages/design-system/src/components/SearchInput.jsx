export function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 text-sm">
        ⌕
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 bg-white border border-ink-200 rounded-card text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-100"
      />
    </div>
  );
}
