export function TabBar({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={`flex border-b border-ink-100 dark:border-ink-800 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-industrial border-b-2 -mb-[2px] transition-colors ${
              isActive
                ? 'border-ink-700 text-ink-700 dark:border-white dark:text-white'
                : 'border-transparent text-ink-400 hover:text-ink-700 dark:text-ink-300 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}