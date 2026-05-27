import styles from '../../styles/stages.module.css';

export function StageCard({ stage, onClick }) {
  return (
    <button className={styles.stageCard} type="button" onClick={() => onClick(stage.key)}>
      <div className={styles.stageTop}>
        <span className={styles.stageDot} style={{ background: stage.color }} />
        <span className={styles.stageTitle}>{stage.title}</span>
      </div>
      <div className={styles.stageCount}>{stage.count}</div>
      <div className={styles.stageLabel}>{stage.label}</div>
      <div className={styles.stageTrack}>
        <div
          className={styles.stageFill}
          style={{ width: `${stage.percentage}%`, background: stage.color }}
        />
      </div>
    </button>
  );
}

