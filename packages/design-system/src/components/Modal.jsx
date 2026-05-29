import { useEffect } from 'react';

export function Modal({ open, onClose, title, label, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-900/40 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-white dark:bg-ink-700 rounded-card shadow-xl w-full ${sizes[size]} border border-ink-100 dark:border-ink-600`}
      >
        <div className="px-6 pt-5 pb-4 border-b border-ink-100 dark:border-ink-600 flex items-start justify-between gap-4">
          <div>
            {label && (
              <div className="label-industrial text-ink-400 dark:text-ink-300 mb-1">{label}</div>
            )}
            {title && (
              <h2 className="font-display font-bold text-ink-700 dark:text-ink-100 text-xl">
                {title}
              </h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 dark:text-ink-300 hover:text-ink-700 dark:hover:text-ink-100 text-2xl leading-none -mt-1"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-ink-100 dark:border-ink-600 bg-ink-50/50 dark:bg-ink-600/50 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
