import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function ModalOverlay({ isOpen, onClose, children }) {
  const contentRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocusRef.current = document.activeElement;
    const content = contentRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(content?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []).filter(
        (element) => element instanceof HTMLElement && !element.hasAttribute('disabled'),
      );

    const focusInitialElement = () => {
      const [first] = focusables();
      if (first) {
        first.focus();
        return;
      }
      content?.focus();
    };

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = focusables();
      if (focusableElements.length === 0) {
        event.preventDefault();
        content?.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first || !content?.contains(document.activeElement)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);

    const raf = requestAnimationFrame(focusInitialElement);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      const previousFocus = previousFocusRef.current;
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-[18px]">
      <button
        className="absolute inset-0 bg-ink-900/60 dark:bg-black/80 border-0"
        type="button"
        onClick={onClose}
        tabIndex={-1}
        aria-label="Cerrar modal"
      />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-stage-modal-title"
        className="relative bg-white dark:bg-ink-700 rounded-card shadow-2xl max-h-[calc(100vh-36px)] max-w-[920px] w-full overflow-hidden outline-none"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
