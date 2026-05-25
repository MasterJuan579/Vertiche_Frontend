import { haceCuanto, epcCorto } from '../utils/format.js';

/**
 * Single-row anomaly banner. Used in the Bitácora page's right column.
 * Different anomaly types get slightly different presentation:
 *   - BAHIA_INCORRECTA: shows expected vs actual bay
 *   - QA_FALLIDO: shows EPC + stage
 *   - TAG_FALTANTE: shows generic message
 *   - LECTURA_DUPLICADA: shows EPC
 */
const TIPO_LABEL = {
  BAHIA_INCORRECTA:  'Bahía incorrecta',
  QA_FALLIDO:        'QA fallido',
  TAG_FALTANTE:      'Tag faltante',
  LECTURA_DUPLICADA: 'Lectura duplicada',
};

export function AnomaliaAlert({ anomalia, onDismiss }) {
  if (!anomalia) return null;

  const label = TIPO_LABEL[anomalia.tipo] || anomalia.tipo;

  return (
    <div className={
      'flex items-start gap-3 px-3.5 py-2.5 rounded-card border-l-4 ' +
      'bg-anomaly-bg border-l-anomaly border border-anomaly-ring/30 ' +
      'dark:bg-anomaly/15 dark:border-l-anomaly-ring dark:border-anomaly-ring/40'
    }>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-display text-[11px] font-bold uppercase tracking-industrial text-anomaly dark:text-anomaly-ring">
            {label}
          </span>
          <span className="font-mono text-[10px] text-ink-400">
            {haceCuanto(anomalia.tiempo)}
          </span>
        </div>
        <div className="text-[12px] text-ink-700 dark:text-ink-100 leading-snug">
          {anomalia.descripcion || `EPC ${epcCorto(anomalia.epc)} en etapa ${anomalia.etapa}`}
        </div>
        {anomalia.epc && anomalia.epc !== '—' && (
          <div className="mt-1 font-mono text-[10px] text-ink-400">
            EPC: <span className="text-rfid dark:text-blue-300">{epcCorto(anomalia.epc)}</span>
            {anomalia.bahia_esperada && (
              <>
                <span className="mx-1">·</span>
                Esperado: <span className="font-semibold">{anomalia.bahia_esperada}</span>
              </>
            )}
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={
            'shrink-0 w-6 h-6 rounded flex items-center justify-center text-base leading-none transition-colors ' +
            'text-anomaly hover:bg-anomaly/15 ' +
            'dark:text-anomaly-ring dark:hover:bg-anomaly/25'
          }
          aria-label="Descartar anomalía"
        >
          ×
        </button>
      )}
    </div>
  );
}
