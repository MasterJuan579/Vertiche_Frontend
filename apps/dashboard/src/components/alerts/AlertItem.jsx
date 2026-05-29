import { formatDateTime, getField } from '../../utils/formatters';

export function AlertItem({ alerta }) {
  return (
    <article className="bg-attention-bg dark:bg-attention-DEFAULT/15 border border-attention-ring/30 dark:border-attention-DEFAULT/40 rounded-card p-3">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-ink-900 dark:text-ink-900 text-[13px] font-bold">{getField(alerta, ['tipo_error', 'tipo', 'codigo'])}</strong>
        <span className="text-ink-400 dark:text-ink-300 text-[11px]">{formatDateTime(getField(alerta, ['timestamp', 'fecha_hora', 'createdAt'], null))}</span>
      </div>
      <p className="text-ink-500 dark:text-ink-200 text-xs my-2">{getField(alerta, ['descripcion', 'detalle', 'mensaje'])}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-400 dark:text-ink-300 text-[11px]">{getField(alerta, ['epc', 'tag_epc'])}</span>
        <span className="text-ink-400 dark:text-ink-300 text-[11px]">{getField(alerta, ['etapa', 'etapa_actual', 'bahia'])}</span>
      </div>
    </article>
  );
}
