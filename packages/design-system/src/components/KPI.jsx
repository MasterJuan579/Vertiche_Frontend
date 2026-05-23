export function KPI({
  label,
  value,
  unit,
  trend,
  trendLabel,
  status,
  size = 'lg',
  accent,
}) {
  const sizeMap = {
    xl: 'text-kpi-xl',
    lg: 'text-kpi-lg',
    md: 'text-kpi-md',
    sm: 'text-kpi-sm',
  };

  const statusColor = {
    flow: 'text-flow',
    attention: 'text-attention',
    anomaly: 'text-anomaly',
  };

  const numberColor = status ? statusColor[status] : 'text-ink-700';

  return (
    <div className="relative">
      {accent && (
        <div
          className="absolute -left-5 top-1 bottom-1 w-1 rounded-r"
          style={{ background: accent }}
        />
      )}
      <div className="label-industrial text-ink-400 mb-2">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className={`font-display tabular ${sizeMap[size]} ${numberColor}`}>{value}</span>
        {unit && (
          <span className="text-ink-400 font-display font-medium text-sm uppercase tracking-industrial">
            {unit}
          </span>
        )}
      </div>
      {trend !== undefined && trendLabel && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span
            className={`font-mono font-semibold ${
              trend > 0 ? 'text-flow' : trend < 0 ? 'text-anomaly' : 'text-ink-400'
            }`}
          >
            {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {Math.abs(trend)}%
          </span>
          <span className="text-ink-400">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
