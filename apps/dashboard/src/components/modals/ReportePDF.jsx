import { memo } from 'react';
import { usePDF } from '../../hooks/usePDF';
import styles from '../../styles/pdf.module.css';

const ReportePDF = memo(function ReportePDF({ etapa, children }) {
  const { contentRef, exportarPDF, generating, error } = usePDF();

  return (
    <>
      <div ref={contentRef} className={styles.pdfContent}>
        <div className={styles.pdfHeader}>
          <h1>VERTICHE - REPORTE DE ETAPA</h1>
          <p className={styles.pdfEtapa}>{String(etapa).toUpperCase()}</p>
          <p className={styles.pdfFecha}>
            {new Date().toLocaleString('es-MX', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </p>
        </div>
        <div className={styles.pdfBody}>{children}</div>
        <div className={styles.pdfFooter}>
          <p>Generado por Vertiche Dashboard v2.4.0</p>
          <p>CEDI Lerma</p>
        </div>
      </div>

      <button
        className={styles.btnReport}
        type="button"
        onClick={() => exportarPDF(etapa)}
        disabled={generating}
      >
        {generating ? (
          <>
            <span className={styles.spinner} />
            GENERANDO PDF...
          </>
        ) : (
          'GENERAR REPORTE DE ETAPA'
        )}
      </button>

      {error && <div className={styles.pdfError}>{error}</div>}
    </>
  );
});

export default ReportePDF;

