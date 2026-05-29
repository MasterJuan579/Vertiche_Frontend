export function ProgressBar({ value = 0, max = 100, color = '#0f766e' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-2 rounded-pill bg-ink-100 dark:bg-ink-500 overflow-hidden">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-ink-400 dark:text-ink-300 font-mono text-[11px]">{pct}%</span>
    </div>
  );
}
