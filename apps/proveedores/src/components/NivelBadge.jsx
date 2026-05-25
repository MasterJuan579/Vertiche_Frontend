/**
 * Pill that displays a supplier's quality level (ELITE / MEDIA / BAJA / NUEVO).
 * The `color` prop is the legacy code ('ba' | 'bb' | 'bc' | 'bn') that comes
 * from SUPPLIERS_INITIAL.
 */
const STYLES = {
  ba: 'bg-flow-bg text-flow border-flow-ring/30 dark:bg-flow/20 dark:text-flow-ring dark:border-flow-ring/40',
  bb: 'bg-attention-bg text-attention border-attention-ring/30 dark:bg-attention/20 dark:text-attention-ring dark:border-attention-ring/40',
  bc: 'bg-anomaly-bg text-anomaly border-anomaly-ring/30 dark:bg-anomaly/20 dark:text-anomaly-ring dark:border-anomaly-ring/40',
  bn: 'bg-blue-50 text-rfid border-rfid/30 dark:bg-rfid/20 dark:text-blue-300 dark:border-rfid/40',
};

export function NivelBadge({ level, color }) {
  const cls = STYLES[color] || STYLES.bn;
  return (
    <span
      className={
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ' +
        'font-display text-[11px] font-medium whitespace-nowrap uppercase tracking-industrial ' +
        cls
      }
    >
      Nivel {level}
    </span>
  );
}
