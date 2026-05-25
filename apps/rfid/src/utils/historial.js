/**
 * Stage history helpers used by ModalOC and ModalResumenOC.
 *
 * The backend may emit multiple log entries per stage (entry, exit, anomaly).
 * consolidarHistorial groups them so each stage has one consolidated row
 * with the earliest entry, latest exit, and OR'd anomaly flag.
 */

const ETAPAS_ORDEN = [
  'PREREGISTRO', 'QA', 'REGISTRO', 'SORTER',
  'BAHIA', 'AUDITORIA', 'ENVIO',
];

export function consolidarHistorial(logs) {
  if (!logs || logs.length === 0) return [];

  const grupos = {};
  logs.forEach((log) => {
    const e = log.etapa;
    if (!grupos[e]) {
      grupos[e] = { ...log };
      return;
    }
    // Earliest entry wins
    if (log.timestamp_entrada && log.timestamp_entrada < grupos[e].timestamp_entrada) {
      grupos[e].timestamp_entrada = log.timestamp_entrada;
      grupos[e].prepacks_entrada = log.prepacks_entrada || grupos[e].prepacks_entrada;
    }
    // Latest exit wins
    if (log.timestamp_salida && (!grupos[e].timestamp_salida || log.timestamp_salida > grupos[e].timestamp_salida)) {
      grupos[e].timestamp_salida = log.timestamp_salida;
      grupos[e].prepacks_salida = log.prepacks_salida || grupos[e].prepacks_salida;
    }
    if (log.tiene_anomalia) grupos[e].tiene_anomalia = true;
  });

  return ETAPAS_ORDEN.filter((e) => grupos[e]).map((e) => grupos[e]);
}

/** Computed status flags for a single prepack/tag. */
export function calcEstatusPrepack(tag) {
  return {
    presente: !!tag.epc && tag.etapa_actual !== null,
    entregado: ['ENVIO', 'COMPLETADO'].includes(tag.etapa_actual),
    calidadOk: !tag.qa_fallido,
  };
}
