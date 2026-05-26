import useDashboardStore from '../../../stores/dashboardStore';
import { STAGE_BY_KEY } from '../../../utils/constants';
import { getOperators, getStageItems } from '../../../utils/calculations';
import { formatDateTime, getField } from '../../../utils/formatters';
import styles from '../../../styles/modal.module.css';

const DATASET_BY_STAGE = {
  preregistro: 'palets',
  qa: 'inspecciones',
  registro: 'tags',
  sorter: 'eventos',
  bahia: 'cajas',
  auditoria: 'tags',
  envio: 'cajas',
};

function useDashboardSnapshot() {
  return useDashboardStore((state) => ({
    tags: state.tags,
    palets: state.palets,
    pedidos: state.pedidos,
    inspecciones: state.inspecciones,
    anomalias: state.anomalias,
    eventos: state.eventos,
    cajas: state.cajas,
    tiendas: state.tiendas,
    proveedores: state.proveedores,
  }));
}

export function StageDetail({ stageKey }) {
  const data = useDashboardSnapshot();
  const stage = STAGE_BY_KEY[stageKey];
  const items = getStageItems(stageKey, data);
  const dataset = DATASET_BY_STAGE[stageKey];
  const sourceItems = data[dataset] ?? items;
  const operators = getOperators(data.inspecciones);

  return (
    <div className={styles.stageDetail}>
      <div className={styles.modalStats}>
        <div>
          <span>Total etapa</span>
          <strong>{items.length || '--'}</strong>
        </div>
        <div>
          <span>Fuente API</span>
          <strong>{sourceItems.length || '--'}</strong>
        </div>
        <div>
          <span>Operadores</span>
          <strong>{operators.length || '--'}</strong>
        </div>
      </div>

      <div className={styles.stageBanner} style={{ borderColor: stage.color }}>
        <span style={{ background: stage.color }} />
        <div>
          <strong>{stage.title}</strong>
          <p>{stage.label}</p>
        </div>
      </div>

      <div className={styles.rows}>
        {items.length > 0 ? (
          items.slice(0, 12).map((item, index) => (
            <div className={styles.row} key={item.id ?? item.epc ?? item.caja_id ?? item.palet_id ?? index}>
              <div>
                <strong>{getField(item, ['epc', 'caja_id', 'palet_id', 'evento_id', 'id'])}</strong>
                <span>{getField(item, ['sku', 'pedido_id', 'tipo_evento', 'estado', 'resultado'])}</span>
              </div>
              <div>
                <strong>{getField(item, ['etapa_actual', 'etapa', 'bahia', 'ubicacion', 'estado'])}</strong>
                <span>{formatDateTime(getField(item, ['timestamp', 'fecha_hora', 'createdAt', 'updatedAt'], null))}</span>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyRows}>--</div>
        )}
      </div>
    </div>
  );
}

