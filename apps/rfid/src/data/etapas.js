// rfid/src/data/etapas.js
// Constantes compartidas de presentación del flujo CEDIS (etapas, colores, helpers de color).
// Toda la data dinámica viene del backend vía realApi; este archivo es estático.

// ============================================
// ETAPAS DEL FLUJO (orden visual del Gantt)
// ============================================
export const ETAPAS_FLUJO = [
  { id: 'PREREGISTRO', label: 'Pre-reg',   short: 'PRE'  },
  { id: 'QA',          label: 'QA',        short: 'QA'   },
  { id: 'REGISTRO',    label: 'Registro',  short: 'REG'  },
  { id: 'SORTER',      label: 'Sorter',    short: 'SORT' },
  { id: 'BAHIA',       label: 'Bahías',    short: 'BAH'  },
  { id: 'AUDITORIA',   label: 'Auditoría', short: 'AUD'  },
  { id: 'ENVIO',       label: 'Envío',     short: 'ENV'  },
];

export const ETAPA_IDX = Object.fromEntries(ETAPAS_FLUJO.map((e, i) => [e.id, i]));

// Orden visual del Gantt; útil para "han pasado por X etapa".
export const ETAPAS_ORDEN = ETAPAS_FLUJO.map((e) => e.id);

// Mapeo del enum `Tag.etapa_actual` del backend al id de la columna del
// Gantt. Centralizado aquí para que el componente Modal y el Gantt usen
// la misma fuente de verdad.
export const ETAPA_DB_TO_GANTT = {
  REGISTRADO:   'PREREGISTRO',
  EN_QA:        'QA',
  APROBADO:     'REGISTRO',
  EN_SORTING:   'SORTER',
  EN_CAJA:      'BAHIA',
  EN_AUDITORIA: 'AUDITORIA',
  RECHAZADO:    'QA',
  ENVIADO:      'ENVIO',
};

export function etapaGanttDeTag(tag) {
  if (!tag) return null;
  return ETAPA_DB_TO_GANTT[tag.etapa_actual] || null;
}

// True si el tag está en o ha avanzado más allá de `etapaGantt`. Útil para
// contar "cuántos prepacks han pasado por Bahía" aunque ya estén en Envío.
export function tagHaPasadoPorEtapa(tag, etapaGantt) {
  const eg = etapaGanttDeTag(tag);
  if (!eg) return false;
  const idxTag = ETAPA_IDX[eg];
  const idxEtapa = ETAPA_IDX[etapaGantt];
  if (idxTag == null || idxEtapa == null) return false;
  return idxTag >= idxEtapa;
}

export const ETAPA_COLORS = {
  // IDs del Gantt visual
  PREREGISTRO: '#2563EB',
  QA:          '#059669',
  REGISTRO:    '#D97706',
  SORTER:      '#7C3AED',
  BAHIA:       '#0891B2',
  AUDITORIA:   '#DB2777',
  ENVIO:       '#16A34A',
  // Aliases para los estados del backend (Tag.etapa_actual) — pintan con
  // el color de su etapa del Gantt correspondiente. Sin esto, cualquier
  // componente que haga `ETAPA_COLORS[tag.etapa_actual]` caía al fallback.
  REGISTRADO:   '#2563EB', // → PREREGISTRO
  EN_QA:        '#059669', // → QA
  APROBADO:     '#D97706', // → REGISTRO
  EN_SORTING:   '#7C3AED', // → SORTER
  EN_CAJA:      '#0891B2', // → BAHIA
  EN_AUDITORIA: '#DB2777', // → AUDITORIA
  RECHAZADO:    '#EF4444', // rojo (estado terminal de fallo, distinto al verde)
  ENVIADO:      '#16A34A', // → ENVIO
};

export const ETAPA_LABELS = {
  PREREGISTRO: 'Pre-registro',
  QA:          'QA',
  REGISTRO:    'Registro',
  SORTER:      'Sorter',
  BAHIA:       'Bahía',
  AUDITORIA:   'Auditoría',
  ENVIO:       'Envío',
  // También los enums DB para compatibilidad cuando se muestre etapa_actual cruda
  REGISTRADO:   'Registrado',
  EN_QA:        'En QA',
  APROBADO:     'Aprobado',
  EN_SORTING:   'En sorter',
  EN_CAJA:      'En caja',
  EN_AUDITORIA: 'En auditoría',
  RECHAZADO:    'Rechazado',
  ENVIADO:      'Enviado',
};

// ============================================
// HELPERS DE COLOR (UI)
// ============================================
const COLORES_CSS = {
  azul: '#3B82F6', rojo: '#EF4444', verde: '#22C55E', negro: '#1E293B',
  blanco: '#F8FAFC', amarillo: '#EAB308', rosa: '#EC4899', gris: '#94A3B8',
  'café': '#92400E', cafe: '#92400E', naranja: '#F97316',
  morado: '#8B5CF6', violeta: '#8B5CF6', beige: '#D4B896',
  'azul oscuro': '#1E3A8A', 'azul marino': '#1E3A8A',
};

export function getColorCSS(c) {
  return COLORES_CSS[(c || '').toLowerCase()] || '#94A3B8';
}

export function esColorClaro(c) {
  return ['blanco', 'white', 'beige', 'amarillo', 'yellow'].includes((c || '').toLowerCase());
}

// ============================================
// HELPERS DE BAHÍA
// ============================================
// El backend ahora usa el formato `B-06` (cambio "bahia V2" del equipo) pero
// históricamente algunas vistas guardaban `BAHIA-6`. Para no romper si llega
// cualquiera de los dos, extraemos el número final del string.
//
//   parseBahiaNumero('B-06')   -> 6
//   parseBahiaNumero('BAHIA-3') -> 3
//   parseBahiaNumero(null)     -> null
export function parseBahiaNumero(s) {
  if (!s) return null;
  const m = String(s).match(/(\d+)\s*$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1 && n <= 10 ? n : null;
}

// Formato canónico actual para mostrar al usuario y comparar entre módulos.
export function formatBahiaId(n) {
  return `B-${String(n).padStart(2, '0')}`;
}
