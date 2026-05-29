import { useAlerts } from '../../hooks/useAlerts';
import { AlertItem } from './AlertItem';

export function AlertsDrawer({ isOpen, onClose }) {
  const alerts = useAlerts();

  return (
    <aside className={`fixed top-0 right-0 bottom-0 w-[calc(100vw-32px)] max-w-[420px] bg-white dark:bg-ink-700 border-l border-ink-100 dark:border-ink-600 shadow-[-10px_0_30px_rgba(0,0,0,0.12)] dark:shadow-[-10px_0_30px_rgba(0,0,0,0.4)] z-60 transform transition-transform duration-200 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-[105%]'}`} aria-hidden={!isOpen}>
      <div className="flex items-center justify-between border-b border-ink-100 dark:border-ink-600 p-[18px]">
        <div>
          <span className="text-ink-400 dark:text-ink-300 text-[11px] font-extrabold tracking-industrial uppercase block">Alertas</span>
          <strong className="text-ink-700 dark:text-ink-100 font-bold">{alerts.length} activas</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar alertas" className="border border-ink-200 dark:border-ink-500 rounded-md h-8 w-8 flex items-center justify-center text-ink-400 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-600">
          x
        </button>
      </div>
      <div className="grid gap-2.5 max-h-[calc(100vh-80px)] overflow-y-auto p-3.5">
        {alerts.length > 0 ? (
          alerts.map((alerta) => <AlertItem key={alerta.id ?? alerta.epc ?? JSON.stringify(alerta)} alerta={alerta} />)
        ) : (
          <div className="text-ink-300 dark:text-ink-400 p-6 text-center">--</div>
        )}
      </div>
    </aside>
  );
}
