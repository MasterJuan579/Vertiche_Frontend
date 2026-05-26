import styles from '../../styles/topbar.module.css';

export function Subbar() {
  return (
    <div className={styles.subbar}>
      <span>CEDI Lerma</span>
      <span>RFID operativo</span>
      <span>API: {import.meta.env.VITE_API_URL || 'http://localhost:8080'}</span>
    </div>
  );
}

