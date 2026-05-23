export function TabBar({ tabs, activeId, onSelect, accent }) {
  return (
    <div className="flex gap-1 border-b border-ink-100 bg-white px-6">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`relative px-4 py-3 text-sm font-display font-semibold transition-colors ${
              active ? 'text-ink-700' : 'text-ink-400 hover:text-ink-700'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-2 text-[10px] font-mono text-ink-400 tabular">
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
