import useDashboardStore from '../../../stores/dashboardStore';
import { STAGE_BY_KEY } from '../../../utils/constants';
import { getOperators, getStageItems } from '../../../utils/calculations';
import { formatDateTime, getField } from '../../../utils/formatters';

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
    <div className="max-h-[58vh] overflow-y-auto p-[18px]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div className="bg-ink-50 dark:bg-ink-600 border border-ink-100 dark:border-ink-600 rounded-card p-3">
          <span className="text-ink-400 dark:text-ink-300 text-[11px] block">Total etapa</span>
          <strong className="text-ink-700 dark:text-ink-100 text-base font-bold block mt-1">{items.length || '--'}</strong>
        </div>
        <div className="bg-ink-50 dark:bg-ink-600 border border-ink-100 dark:border-ink-600 rounded-card p-3">
          <span className="text-ink-400 dark:text-ink-300 text-[11px] block">Fuente API</span>
          <strong className="text-ink-700 dark:text-ink-100 text-base font-bold block mt-1">{sourceItems.length || '--'}</strong>
        </div>
        <div className="bg-ink-50 dark:bg-ink-600 border border-ink-100 dark:border-ink-600 rounded-card p-3">
          <span className="text-ink-400 dark:text-ink-300 text-[11px] block">Operadores</span>
          <strong className="text-ink-700 dark:text-ink-100 text-base font-bold block mt-1">{operators.length || '--'}</strong>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-ink-50 dark:bg-ink-600 border border-ink-100 dark:border-ink-600 rounded-card p-3 my-3" style={{ borderColor: stage.color }}>
        <span className="rounded-pill h-3.5 w-3.5" style={{ background: stage.color }} />
        <div>
          <strong>{stage.title}</strong>
          <p className="text-ink-400 dark:text-ink-300 text-xs mt-0.5">{stage.label}</p>
        </div>
      </div>

      <div className="grid gap-2">
        {items.length > 0 ? (
          items.slice(0, 12).map((item, index) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-ink-50 dark:bg-ink-600 border border-ink-100 dark:border-ink-600 rounded-card p-3" key={item.id ?? item.epc ?? item.caja_id ?? item.palet_id ?? index}>
              <div>
                <strong className="text-ink-700 dark:text-ink-100 text-base font-bold block">{getField(item, ['epc', 'caja_id', 'palet_id', 'evento_id', 'id'])}</strong>
                <span className="text-ink-400 dark:text-ink-300 text-[11px] block mt-1">{getField(item, ['sku', 'pedido_id', 'tipo_evento', 'estado', 'resultado'])}</span>
              </div>
              <div>
                <strong className="text-ink-700 dark:text-ink-100 text-base font-bold block">{getField(item, ['etapa_actual', 'etapa', 'bahia', 'ubicacion', 'estado'])}</strong>
                <span className="text-ink-400 dark:text-ink-300 text-[11px] block mt-1">{formatDateTime(getField(item, ['timestamp', 'fecha_hora', 'fecha', 'createdAt', 'updatedAt'], null))}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-ink-50 dark:bg-ink-600 border border-ink-100 dark:border-ink-600 rounded-card p-3 text-ink-300 dark:text-ink-400 text-center">--</div>
        )}
      </div>
    </div>
  );
}
