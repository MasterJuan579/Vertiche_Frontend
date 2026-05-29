import { useEffect } from 'react';

export function ModalOverlay({ isOpen, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-[18px]">
      <button className="absolute inset-0 bg-ink-900/60 dark:bg-black/80 border-0" type="button" onClick={onClose} aria-label="Cerrar modal" />
      <div className="relative bg-white dark:bg-ink-700 rounded-card shadow-2xl max-h-[calc(100vh-36px)] max-w-[920px] w-full overflow-hidden">{children}</div>
    </div>
  );
}
