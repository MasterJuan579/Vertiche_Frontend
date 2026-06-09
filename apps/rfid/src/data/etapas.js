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

export const ETAPA_COLORS = {
  PREREGISTRO: '#2563EB',
  QA:          '#059669',
  REGISTRO:    '#D97706',
  SORTER:      '#7C3AED',
  BAHIA:       '#0891B2',
  AUDITORIA:   '#DB2777',
  ENVIO:       '#16A34A',
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
