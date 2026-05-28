import styles from '../../styles/modal.module.css';

export function ModalHeader({ title, onClose }) {
  return (
    <header className={styles.mHead}>
      <div>
        <span>Detalle de etapa</span>
        <h2>{title}</h2>
      </div>
      <button type="button" onClick={onClose} aria-label="Cerrar">
        x
      </button>
    </header>
  );
}

