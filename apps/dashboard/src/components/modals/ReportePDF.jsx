import { memo } from 'react';
import { usePDF } from '../../hooks/usePDF';
import { StageDetailContent } from './stages/StageDetail';
import '../../styles/pdf-print.css';

const ReportePDF = memo(function ReportePDF({ etapa }) {
  const { contentRef, exportarPDF, generating, error } = usePDF();

  return (
    <>
      <div ref={contentRef} className="pdf-screen-hidden bg-white text-ink-900 font-body p-5">
        <div className="border-b-2 border-dashboard pb-4 mb-5 text-center">
          <h1 className="text-dashboard font-display text-2xl font-bold m-0">VERTICHE - REPORTE DE ETAPA</h1>
          <p className="text-ink-900 font-display text-lg font-semibold my-[5px]">{String(etapa).toUpperCase()}</p>
          <p className="text-ink-400 text-[11px]">
            {new Date().toLocaleString('es-MX', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </p>
        </div>
        <div className="my-5">
          <StageDetailContent stageKey={etapa} />
        </div>
        <div className="border-t border-ink-100 mt-5 pt-2.5 text-center text-ink-400 text-[11px]">
          <p>Generado por Vertiche Dashboard v2.4.0</p>
          <p>CEDI Lerma</p>
        </div>
      </div>

      <button
        className="pdf-print-hide flex items-center justify-center gap-2 w-full uppercase text-[11px] font-extrabold tracking-industrial bg-dashboard hover:bg-[#236030] text-white border-none cursor-pointer p-3.5 disabled:cursor-not-allowed disabled:opacity-70"
        type="button"
        onClick={() => exportarPDF(etapa)}
        disabled={generating}
      >
        {generating ? (
          <>
            <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            GENERANDO PDF...
          </>
        ) : (
          'GENERAR REPORTE DE ETAPA'
        )}
      </button>

      {error && <div className="bg-anomaly-bg border border-anomaly-ring/30 text-ink-900 text-[11px] p-2 px-3 text-center">{error}</div>}
    </>
  );
});

export default ReportePDF;
