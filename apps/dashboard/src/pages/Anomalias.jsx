import { KPIValue, StatusBadge } from '../components/common';
import useDashboardStore from '../stores/dashboardStore';
import { isActiveAnomaly } from '../utils/calculations';
import { formatDateTime, getField } from '../utils/formatters';

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
    <main className="max-w-[1400px] mx-auto p-6 md:p-4">
      <div className="mb-[18px]">
        <span className="text-ink-400 dark:text-ink-300 text-[11px] font-bold tracking-industrial uppercase block">
          Calidad operativa
        </span>
        <h1 className="font-display text-ink-700 dark:text-ink-100 text-[28px] font-bold mt-1">
          Anomalías
        </h1>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4 md:grid-cols-1">
        <KPIValue label="Sin resolver" value={unresolved.length || '--'} status={unresolved.length > 0 ? 'warning' : 'ok'} />
        <KPIValue label="Resueltas" value={resolved.length || '--'} />
        <KPIValue label="Total" value={anomalias.length || '--'} />
        <KPIValue label="Tipos" value={Object.keys(byType).length || '--'} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 md:grid-cols-1">
        {Object.entries(byType).map(([type, count]) => (
          <div className="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 rounded-card p-4" key={type}>
            <span className="text-ink-400 dark:text-ink-300 text-[11px] font-bold tracking-[0.06em] uppercase block">
              {type}
            </span>
            <strong className="text-ink-700 dark:text-ink-100 font-mono text-[28px] font-bold block mt-1.5">
              {count}
            </strong>
          </div>
        ))}
      </div>

      <section className="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 rounded-card overflow-hidden">
        <div className="border-b border-ink-100 dark:border-ink-600 px-4 py-3.5 text-ink-400 dark:text-ink-300 text-[11px] font-bold tracking-industrial uppercase">
          Eventos registrados
        </div>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[1fr_1.2fr_1fr_1.4fr_1.1fr] min-w-[860px]">
            <span className="bg-ink-50 dark:bg-ink-600 border-b border-ink-100 dark:border-ink-600 text-ink-400 dark:text-ink-300 text-[10px] font-extrabold tracking-industrial uppercase px-3.5 py-3">EPC</span>
            <span className="bg-ink-50 dark:bg-ink-600 border-b border-ink-100 dark:border-ink-600 text-ink-400 dark:text-ink-300 text-[10px] font-extrabold tracking-industrial uppercase px-3.5 py-3">Tipo</span>
            <span className="bg-ink-50 dark:bg-ink-600 border-b border-ink-100 dark:border-ink-600 text-ink-400 dark:text-ink-300 text-[10px] font-extrabold tracking-industrial uppercase px-3.5 py-3">Etapa</span>
            <span className="bg-ink-50 dark:bg-ink-600 border-b border-ink-100 dark:border-ink-600 text-ink-400 dark:text-ink-300 text-[10px] font-extrabold tracking-industrial uppercase px-3.5 py-3">Proveedor</span>
            <span className="bg-ink-50 dark:bg-ink-600 border-b border-ink-100 dark:border-ink-600 text-ink-400 dark:text-ink-300 text-[10px] font-extrabold tracking-industrial uppercase px-3.5 py-3">Estado</span>
          </div>
          {anomalias.length > 0 ? (
            anomalias.map((a) => {
              const proveedor = getProveedor(getField(a, ['proveedor_id', 'proveedorId'], null));
              const active = isActiveAnomaly(a);
              return (
                <div className="grid grid-cols-[1fr_1.2fr_1fr_1.4fr_1.1fr] min-w-[860px]" key={a.id ?? a.epc ?? JSON.stringify(a)}>
                  <span className="border-b border-ink-100 dark:border-ink-600 text-ink-500 dark:text-ink-200 text-xs px-3.5 py-3">{getField(a, ['epc', 'tag_epc'])}</span>
                  <span className="border-b border-ink-100 dark:border-ink-600 text-ink-500 dark:text-ink-200 text-xs px-3.5 py-3">{getField(a, ['tipo_error', 'tipo', 'codigo'])}</span>
                  <span className="border-b border-ink-100 dark:border-ink-600 text-ink-500 dark:text-ink-200 text-xs px-3.5 py-3">{getField(a, ['etapa', 'etapa_actual', 'bahia'])}</span>
                  <span className="border-b border-ink-100 dark:border-ink-600 text-ink-500 dark:text-ink-200 text-xs px-3.5 py-3">{proveedor?.nombre ?? '--'}</span>
                  <span className="border-b border-ink-100 dark:border-ink-600 text-ink-500 dark:text-ink-200 text-xs px-3.5 py-3">
                    <StatusBadge status={active ? 'warning' : 'ok'}>
                      {active ? 'PENDIENTE' : 'RESUELTA'}
                    </StatusBadge>
                    <small className="text-ink-300 dark:text-ink-400 text-[10px] block mt-1">
                      {formatDateTime(getField(a, ['timestamp', 'fecha_hora', 'createdAt'], null))}
                    </small>
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-ink-300 dark:text-ink-400 p-6 text-center">--</div>
          )}
        </div>
      </section>
    </main>
  );
}
