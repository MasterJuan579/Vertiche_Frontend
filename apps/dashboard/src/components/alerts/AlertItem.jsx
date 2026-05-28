import { formatDateTime, getField } from '../../utils/formatters';
import styles from '../../styles/drawer.module.css';

export function AlertItem({ alerta }) {
  return (
    <article className={styles.alertItem}>
      <div className={styles.alertTop}>
        <strong>{getField(alerta, ['tipo_error', 'tipo', 'codigo'])}</strong>
        <span>{formatDateTime(getField(alerta, ['timestamp', 'fecha_hora', 'createdAt'], null))}</span>
      </div>
      <p>{getField(alerta, ['descripcion', 'detalle', 'mensaje'])}</p>
      <div className={styles.alertMeta}>
        <span>{getField(alerta, ['epc', 'tag_epc'])}</span>
        <span>{getField(alerta, ['etapa', 'etapa_actual', 'bahia'])}</span>
      </div>
    </article>
  );
}

