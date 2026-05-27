import useDashboardStore from '../../stores/dashboardStore';
import { formatDateTime } from '../../utils/formatters';
import styles from '../../styles/topbar.module.css';

export function Topbar({ onRefresh, refreshing }) {
  const lastUpdate = useDashboardStore((state) => state.lastUpdate);
  const error = useDashboardStore((state) => state.error);
  const openDrawer = useDashboardStore((state) => state.openDrawer);
  const alertCount = useDashboardStore((state) => state.getAnomaliasActivas().length);

  return (
    <div className={styles.topbar}>
      <div>
        <div className={styles.eyebrow}>Operación en vivo</div>
        <h1 className={styles.title}>Dashboard CEDI Lerma</h1>
      </div>
      <div className={styles.actions}>
        <div className={error ? styles.syncError : styles.syncOk}>
          <span className={styles.liveDot} />
          {error ? `Error API: ${error}` : `Actualizado ${formatDateTime(lastUpdate)}`}
        </div>
        <button className={styles.iconButton} type="button" onClick={openDrawer} aria-label="Abrir alertas">
          !
          {alertCount > 0 && <span className={styles.badge}>{alertCount}</span>}
        </button>
        <button className={styles.refreshButton} type="button" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Actualizando' : 'Actualizar'}
        </button>
      </div>
    </div>
  );
}

