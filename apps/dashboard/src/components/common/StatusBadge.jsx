import styles from '../../styles/common.module.css';

const STATUS_CLASS = {
  ok: styles.statusOk,
  warning: styles.statusWarning,
  critical: styles.statusCritical,
  idle: styles.statusIdle,
};

export function StatusBadge({ status = 'idle', children }) {
  return (
    <span className={`${styles.statusBadge} ${STATUS_CLASS[status] ?? styles.statusIdle}`}>
      {children}
    </span>
  );
}

