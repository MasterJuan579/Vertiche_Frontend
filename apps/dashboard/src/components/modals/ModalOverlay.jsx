import { useEffect } from 'react';
import styles from '../../styles/modal.module.css';

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
    <div className={styles.overlay}>
      <button className={styles.backdrop} type="button" onClick={onClose} aria-label="Cerrar modal" />
      <div className={styles.modal}>{children}</div>
    </div>
  );
}

