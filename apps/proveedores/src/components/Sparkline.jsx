/**
 * Tiny bar chart for showing a trend (e.g., last 12 inspection ratings).
 * Bars are colored by the rating semantics: green for high, amber for mid,
 * red for low.
 */
export function Sparkline({ data = [], height = 60 }) {
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((v, i) => {
        const colorCls =
          v >= 4.5
            ? 'bg-flow-ring'
            : v >= 2.5
            ? 'bg-attention-ring'
            : v > 0
            ? 'bg-anomaly-ring'
            : 'bg-ink-100 dark:bg-ink-600';
        return (
          <div
            key={i}
            title={String(v)}
            className={'flex-1 rounded-t transition-all ' + colorCls}
            style={{
              height: `${(v / 5) * 100}%`,
              minHeight: 4,
            }}
          />
        );
      })}
    </div>
  );
}
