/**
 * Formatting helpers shared across the rfid module.
 *
 * Kept separate from the data layer because these are presentation concerns
 * (display strings, not data shape).
 */

/** "8:45" — military time, 24h, no seconds */
export function formatHora(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** "2h 15min" or "45min" or "—" */
export function formatDur(min) {
  if (!min && min !== 0) return '—';
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}min`;
  return `${min}min`;
}

/** "hace 5s" / "hace 2min" / "hace 1h" — relative time, Spanish */
export function haceCuanto(timestamp) {
  if (!timestamp) return '';
  const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

/** Short EPC display: "···A3F012" (last 6 chars after ellipsis) */
export function epcCorto(epc) {
  if (!epc) return '—';
  if (epc.length <= 8) return epc;
  return `···${epc.slice(-6)}`;
}

/** Truncated EPC: "EPC-SIM-000000000001…" for narrow tables */
export function epcTruncado(epc, maxLen = 20) {
  if (!epc) return '—';
  if (epc.length <= maxLen) return epc;
  return `${epc.substring(0, maxLen - 2)}…`;
}

/** Duration between two ISO timestamps, in minutes (rounded) */
export function durMinutes(tsEntrada, tsSalida) {
  if (!tsEntrada || !tsSalida) return null;
  return Math.round((new Date(tsSalida) - new Date(tsEntrada)) / 60000);
}
