import styles from '../../styles/modal.module.css';

export function ModalContent({ children }) {
  return <div className={styles.mContent}>{children}</div>;
}

