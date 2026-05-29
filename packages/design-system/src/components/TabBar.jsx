export function TabBar({ tabs, activeId, onSelect, accent }) {
  return (
    <div className="flex gap-1 border-b border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-700 px-6">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`relative px-4 py-3 text-sm font-display font-semibold transition-colors ${
              active ? 'text-ink-700 dark:text-ink-100' : 'text-ink-400 dark:text-ink-300 hover:text-ink-700 dark:hover:text-ink-100'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-2 text-[10px] font-mono text-ink-400 dark:text-ink-300 tabular">
                {tab.badge}
              </span>
            )}
            {active && (
              <span
                className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t"
                style={{ background: accent || '#161B23' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
