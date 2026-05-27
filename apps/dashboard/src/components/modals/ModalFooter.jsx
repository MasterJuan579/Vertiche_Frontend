import ReportePDF from './ReportePDF';
import styles from '../../styles/modal.module.css';

export function ModalFooter({ etapa, children }) {
  return (
    <div className={styles.mFoot}>
      <ReportePDF etapa={etapa}>{children}</ReportePDF>
    </div>
  );
}

