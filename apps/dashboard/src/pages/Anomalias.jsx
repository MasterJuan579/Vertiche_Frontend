import { KPIValue, StatusBadge } from '../components/common';
import useDashboardStore from '../stores/dashboardStore';
import { isActiveAnomaly } from '../utils/calculations';
import { formatDateTime, getField } from '../utils/formatters';
import styles from '../styles/global.module.css';

export function Anomalias() {
  const anomalias = useDashboardStore((state) => state.anomalias);
  const proveedores = useDashboardStore((state) => state.proveedores);
  const unresolved = anomalias.filter(isActiveAnomaly);
  const resolved = anomalias.filter((a) => !isActiveAnomaly(a));
  const byType = anomalias.reduce((acc, a) => {
    const type = getField(a, ['tipo_error', 'tipo', 'codigo']);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const getProveedor = (id) =>
    proveedores.find((proveedor) => String(proveedor.id ?? proveedor.proveedor_id) === String(id));

  return (
    <main className={styles.page}>
      <div className={styles.sectionHead}>
        <span>Calidad operativa</span>
        <h1>Anomalias</h1>
      </div>

      <div className={styles.metricGrid}>
        <KPIValue label="Sin resolver" value={unresolved.length || '--'} status={unresolved.length > 0 ? 'warning' : 'ok'} />
        <KPIValue label="Resueltas" value={resolved.length || '--'} />
        <KPIValue label="Total" value={anomalias.length || '--'} />
        <KPIValue label="Tipos" value={Object.keys(byType).length || '--'} />
      </div>

      <div className={styles.typeGrid}>
        {Object.entries(byType).map(([type, count]) => (
          <div className={styles.typeCard} key={type}>
            <span>{type}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      <section className={styles.tablePanel}>
        <div className={styles.tableHeader}>Eventos registrados</div>
        <div className={styles.table}>
          <div className={styles.tableRowHead}>
            <span>EPC</span>
            <span>Tipo</span>
            <span>Etapa</span>
            <span>Proveedor</span>
            <span>Estado</span>
          </div>
          {anomalias.length > 0 ? (
            anomalias.map((a) => {
              const proveedor = getProveedor(getField(a, ['proveedor_id', 'proveedorId'], null));
              const active = isActiveAnomaly(a);
              return (
                <div className={styles.tableRow} key={a.id ?? a.epc ?? JSON.stringify(a)}>
                  <span>{getField(a, ['epc', 'tag_epc'])}</span>
                  <span>{getField(a, ['tipo_error', 'tipo', 'codigo'])}</span>
                  <span>{getField(a, ['etapa', 'etapa_actual', 'bahia'])}</span>
                  <span>{proveedor?.nombre ?? '--'}</span>
                  <span>
                    <StatusBadge status={active ? 'warning' : 'ok'}>
                      {active ? 'PENDIENTE' : 'RESUELTA'}
                    </StatusBadge>
                    <small>{formatDateTime(getField(a, ['timestamp', 'fecha_hora', 'createdAt'], null))}</small>
                  </span>
                </div>
              );
            })
          ) : (
            <div className={styles.empty}>--</div>
          )}
        </div>
      </section>
    </main>
  );
}
