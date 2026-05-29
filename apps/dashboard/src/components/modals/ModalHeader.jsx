export function ModalHeader({ title, onClose }) {
  return (
    <header className="flex items-center justify-between border-b border-ink-100 dark:border-ink-600 px-5 py-[18px]">
      <div>
        <span className="text-ink-400 dark:text-ink-300 text-[11px] font-extrabold tracking-industrial uppercase block">Detalle de etapa</span>
        <h2 className="text-ink-700 dark:text-ink-100 font-display text-[22px] font-bold mt-0.5">{title}</h2>
      </div>
      <button type="button" onClick={onClose} aria-label="Cerrar" className="border border-ink-200 dark:border-ink-500 rounded-md h-[34px] w-[34px] flex items-center justify-center text-ink-400 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-600">
        x
      </button>
    </header>
  );
}
