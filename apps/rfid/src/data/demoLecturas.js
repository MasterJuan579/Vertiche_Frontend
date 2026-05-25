/**
 * Mock RFID reading log for the Bitácora page.
 *
 * Without Socket.io this is a static snapshot meant to look believable: a mix
 * of normal readings across all 7 stages with realistic timestamps spread
 * across the last 90 minutes, plus a handful of anomalies (duplicate reads,
 * misroutings, missing tags).
 *
 * When the backend lands, replace `lecturasIniciales` / `anomaliasIniciales`
 * with API calls and re-introduce Socket.io listeners for `lectura` /
 * `anomalia` events.
 */

import { ETAPAS_FLUJO } from './demoOCs.js';

// Build timestamps relative to NOW so the page always looks current.
// `minutesAgo` returns an ISO timestamp N minutes before runtime.
function minutesAgo(n) {
  return new Date(Date.now() - n * 60000).toISOString();
}

/**
 * A handful of EPCs from the FlujoCEDIS data so events cross-reference
 * real prepacks (clicking Bitácora rows could navigate to Trazabilidad).
 */
const EPC_POOL = [
  'E001A', 'E001B', 'E002A', 'E003A', 'E005B', 'E005C',
  'E006A', 'E007A', 'E008A', 'E009A', 'E010A', 'E011A',
  'E012A', 'E012B', 'E013A', 'E014A', 'E015A', 'E015B',
  'E017A', 'E018A', 'E020A', 'E022A', 'E022C', 'E024B',
];

/**
 * Stage IDs for varied reading events. The Bitácora page filter buttons
 * map to these.
 */
const STAGES = ETAPAS_FLUJO.map((e) => e.id);

function mkLectura(idx, etapa, epc, opts = {}) {
  return {
    id: `LEC-${String(idx).padStart(5, '0')}`,
    epc,
    etapa,
    lector: `LECTOR-${etapa}-01`,
    tiempo: minutesAgo(opts.ageMin ?? idx * 2),
    es_duplicado: opts.duplicado || false,
    detalle: opts.detalle || etapa,
  };
}

/**
 * Realistic event stream — 50 events, mostly normal, a few duplicates,
 * spread roughly evenly across the 7 stages with stage frequencies that
 * mirror real CEDIS throughput (more PREREGISTRO + BAHIA than AUDITORIA).
 */
export const LECTURAS_INICIALES = [
  // Most recent events first (smaller ageMin = more recent)
  mkLectura(1,  'BAHIA',       'E018A', { ageMin: 1 }),
  mkLectura(2,  'BAHIA',       'E017A', { ageMin: 2 }),
  mkLectura(3,  'BAHIA',       'E015A', { ageMin: 3 }),
  mkLectura(4,  'AUDITORIA',   'E020A', { ageMin: 4 }),
  mkLectura(5,  'SORTER',      'E012B', { ageMin: 5 }),
  mkLectura(6,  'PREREGISTRO', 'E001A', { ageMin: 6 }),
  mkLectura(7,  'QA',          'E005B', { ageMin: 7 }),
  mkLectura(8,  'REGISTRO',    'E009A', { ageMin: 8 }),
  mkLectura(9,  'BAHIA',       'E015B', { ageMin: 9 }),
  mkLectura(10, 'ENVIO',       'E022A', { ageMin: 10 }),
  mkLectura(11, 'AUDITORIA',   'E020A', { ageMin: 11, duplicado: true }),
  mkLectura(12, 'PREREGISTRO', 'E001B', { ageMin: 12 }),
  mkLectura(13, 'QA',          'E006A', { ageMin: 13 }),
  mkLectura(14, 'REGISTRO',    'E011A', { ageMin: 14 }),
  mkLectura(15, 'BAHIA',       'E014A', { ageMin: 16 }),
  mkLectura(16, 'SORTER',      'E013A', { ageMin: 17 }),
  mkLectura(17, 'PREREGISTRO', 'E002A', { ageMin: 18 }),
  mkLectura(18, 'QA',          'E007A', { ageMin: 19 }),
  mkLectura(19, 'BAHIA',       'E018A', { ageMin: 20, duplicado: true }),
  mkLectura(20, 'ENVIO',       'E022C', { ageMin: 22 }),
  mkLectura(21, 'AUDITORIA',   'E025A', { ageMin: 23 }),
  mkLectura(22, 'REGISTRO',    'E010A', { ageMin: 25 }),
  mkLectura(23, 'PREREGISTRO', 'E003A', { ageMin: 27 }),
  mkLectura(24, 'QA',          'E008A', { ageMin: 29 }),
  mkLectura(25, 'BAHIA',       'E017A', { ageMin: 30, duplicado: true }),
  mkLectura(26, 'SORTER',      'E012B', { ageMin: 32 }),
  mkLectura(27, 'PREREGISTRO', 'E001A', { ageMin: 35 }),
  mkLectura(28, 'REGISTRO',    'E009A', { ageMin: 37 }),
  mkLectura(29, 'BAHIA',       'E015A', { ageMin: 40 }),
  mkLectura(30, 'AUDITORIA',   'E024B', { ageMin: 42 }),
  mkLectura(31, 'QA',          'E005C', { ageMin: 45 }),
  mkLectura(32, 'SORTER',      'E014A', { ageMin: 48 }),
  mkLectura(33, 'ENVIO',       'E022C', { ageMin: 50 }),
  mkLectura(34, 'PREREGISTRO', 'E002A', { ageMin: 53 }),
  mkLectura(35, 'BAHIA',       'E018A', { ageMin: 56 }),
  mkLectura(36, 'QA',          'E006A', { ageMin: 60 }),
  mkLectura(37, 'REGISTRO',    'E010A', { ageMin: 63 }),
  mkLectura(38, 'BAHIA',       'E015B', { ageMin: 66 }),
  mkLectura(39, 'PREREGISTRO', 'E003A', { ageMin: 69 }),
  mkLectura(40, 'SORTER',      'E013A', { ageMin: 72 }),
  mkLectura(41, 'AUDITORIA',   'E020A', { ageMin: 75 }),
  mkLectura(42, 'BAHIA',       'E017A', { ageMin: 78 }),
  mkLectura(43, 'QA',          'E008A', { ageMin: 80 }),
  mkLectura(44, 'PREREGISTRO', 'E001B', { ageMin: 82 }),
  mkLectura(45, 'REGISTRO',    'E011A', { ageMin: 84 }),
  mkLectura(46, 'BAHIA',       'E015A', { ageMin: 86 }),
  mkLectura(47, 'ENVIO',       'E022A', { ageMin: 88 }),
  mkLectura(48, 'PREREGISTRO', 'E002A', { ageMin: 89 }),
  mkLectura(49, 'BAHIA',       'E014A', { ageMin: 90 }),
  mkLectura(50, 'SORTER',      'E012B', { ageMin: 92 }),
];

/**
 * Anomaly stream — 5 recent events that explain why the Gantt shows red cells.
 */
export const ANOMALIAS_INICIALES = [
  {
    id: 'ANO-001',
    tipo: 'BAHIA_INCORRECTA',
    epc: 'E017A',
    etapa: 'BAHIA',
    bahia: 'BAHIA-7',
    bahia_esperada: 'BAHIA-8',
    tiempo: minutesAgo(2),
    descripcion: 'Prepack detectado en bahía 7 cuando estaba asignado a bahía 8',
  },
  {
    id: 'ANO-002',
    tipo: 'QA_FALLIDO',
    epc: 'E006A',
    etapa: 'QA',
    tiempo: minutesAgo(13),
    descripcion: 'Prenda defectuosa detectada en QA — Polo Piqué Hombre',
  },
  {
    id: 'ANO-003',
    tipo: 'TAG_FALTANTE',
    epc: '—',
    etapa: 'REGISTRO',
    tiempo: minutesAgo(28),
    descripcion: 'OC-011: 1 prepack esperado no apareció en registro',
  },
  {
    id: 'ANO-004',
    tipo: 'QA_FALLIDO',
    epc: 'E019A',
    etapa: 'AUDITORIA',
    tiempo: minutesAgo(43),
    descripcion: 'Pantalón Vestir Slim — defecto en costura central',
  },
  {
    id: 'ANO-005',
    tipo: 'LECTURA_DUPLICADA',
    epc: 'E018A',
    etapa: 'BAHIA',
    tiempo: minutesAgo(20),
    descripcion: 'Mismo EPC leído 3 veces en menos de 30 segundos',
  },
];

/**
 * KPI counters for the Bitácora top strip.
 */
export function getContadores() {
  return {
    preregistro: LECTURAS_INICIALES.filter((e) => e.etapa === 'PREREGISTRO').length,
    bahia:       LECTURAS_INICIALES.filter((e) => e.etapa === 'BAHIA').length,
    anomalias:   ANOMALIAS_INICIALES.length,
    duplicados:  LECTURAS_INICIALES.filter((e) => e.es_duplicado).length,
  };
}

export { STAGES };
