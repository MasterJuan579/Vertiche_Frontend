import { useAlerts } from '../../hooks/useAlerts';
import { AlertItem } from './AlertItem';
import styles from '../../styles/drawer.module.css';

export function AlertsDrawer({ isOpen, onClose }) {
  const alerts = useAlerts();

  return (
    <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`} aria-hidden={!isOpen}>
      <div className={styles.drawerHead}>
        <div>
          <span>Alertas</span>
          <strong>{alerts.length} activas</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar alertas">
          x
        </button>
      </div>
      <div className={styles.drawerBody}>
        {alerts.length > 0 ? (
          alerts.map((alerta) => <AlertItem key={alerta.id ?? alerta.epc ?? JSON.stringify(alerta)} alerta={alerta} />)
        ) : (
          <div className={styles.empty}>--</div>
        )}
      </div>
    </aside>
  );
}

