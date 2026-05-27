import styles from '../../styles/common.module.css';

export function Skeleton({ height = 120 }) {
  return <div className={styles.skeleton} style={{ minHeight: height }} />;
}

