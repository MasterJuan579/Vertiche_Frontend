export function StageCard({ stage, onClick }) {
  return (
    <button
      className="bg-ink-50 dark:bg-ink-600 border border-ink-100 dark:border-ink-600 rounded-card min-h-[156px] p-3.5 text-left transition-all duration-200 hover:border-dashboard dark:hover:border-dashboard hover:-translate-y-0.5"
      type="button"
      onClick={() => onClick(stage.key)}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-pill h-2.5 w-2.5" style={{ background: stage.color }} />
        <span className="text-ink-700 dark:text-ink-100 text-[13px] font-extrabold">{stage.title}</span>
      </div>
      <div className="text-ink-700 dark:text-ink-100 font-mono text-[34px] font-bold mt-[18px]">{stage.count}</div>
      <div className="text-ink-400 dark:text-ink-300 text-[11px] font-extrabold tracking-industrial uppercase">{stage.label}</div>
      <div className="bg-ink-100 dark:bg-ink-500 rounded-pill h-1.5 mt-3.5 overflow-hidden">
        <div
          className="h-full"
          style={{ width: `${stage.percentage}%`, background: stage.color }}
        />
      </div>
    </button>
  );
}
