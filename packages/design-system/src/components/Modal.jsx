export function Modal({ isOpen, onClose, title, children, footerAction, footerLabel = 'Confirmar' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-card border border-ink-100 shadow-xl overflow-hidden dark:bg-ink-800 dark:border-ink-700 transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between dark:border-ink-700">
          <h3 className="font-display font-semibold text-ink-700 text-base dark:text-white">
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="text-ink-400 hover:text-ink-700 dark:text-ink-300 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-sm text-ink-500 dark:text-ink-100">
          {children}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-ink-50 border-t border-ink-100 flex justify-end gap-3 dark:bg-ink-900 dark:border-ink-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-display font-semibold uppercase tracking-industrial text-ink-400 hover:text-ink-700 dark:text-ink-300 dark:hover:text-white"
          >
            Cancelar
          </button>
          {footerAction && (
            <button
              onClick={footerAction}
              className="px-4 py-2 bg-ink-700 text-white rounded-card text-xs font-display font-semibold uppercase tracking-industrial hover:bg-ink-900 dark:bg-ink-100 dark:text-ink-900 dark:hover:bg-white"
            >
              {footerLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}