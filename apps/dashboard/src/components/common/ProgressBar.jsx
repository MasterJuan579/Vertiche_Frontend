import styles from '../../styles/common.module.css';

export function ProgressBar({ value = 0, max = 100, color = '#0f766e' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.progressValue}>{pct}%</span>
    </div>
  );
}

