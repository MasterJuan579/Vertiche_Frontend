// rfid/src/data/demoOCs.js
import { realApi } from '../services/realApi';

// ============================================
// CONSTANTES (NO CAMBIAN)
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
};

// ============================================
// DATOS REALES (se llenan desde la API)
// ============================================

export let DEMO_OCS = [];
export let DEMO_KPI = {
  mejora_porcentaje: 30.6,
  objetivo_mejora_pct: 32,
  tiempo_promedio_hoy_min: 125,
  palets_activos: 0,
  palets_completados_hoy: 0
};

// ============================================
// FUNCIÓN PARA CARGAR DATOS DEL BACKEND
// ============================================

export async function cargarDatosReales() {
  try {
    const [ocs, stats] = await Promise.all([
      realApi.getOrdenesCompra(),
      realApi.getEstadisticas()
    ]);
    
    DEMO_OCS.length = 0;
    DEMO_OCS.push(...ocs);
    
    DEMO_KPI = {
      mejora_porcentaje: 30.6,
      objetivo_mejora_pct: 32,
      tiempo_promedio_hoy_min: stats.tiempo_promedio || 125,
      palets_activos: stats.total_tags || ocs.length,
      palets_completados_hoy: stats.palets_completados_hoy || 0
    };
    
    console.log(`✅ Cargadas ${ocs.length} órdenes de compra`);
    return true;
  } catch (error) {
    console.error('Error cargando datos reales:', error);
    return false;
  }
}

// ============================================
// FUNCIONES AUXILIARES (mantienen compatibilidad)
// ============================================

export function getOC(ordenId) {
  return DEMO_OCS.find((oc) => oc.ordenId === ordenId);
}

export function getOCsInBay(numBahia, etapa) {
  const bahiaId = `BAHIA-${numBahia}`;
  return DEMO_OCS.filter((oc) =>
    (oc.tagsPorEtapa?.[etapa] || []).some(
      (t) => t.tienda?.bahia_asignada === bahiaId
    )
  );
}

export function getAllPrepacks() {
  return DEMO_OCS.flatMap((oc) =>
    oc.tags.map((t) => ({ ...t, ordenId: oc.ordenId, ocNombre: oc.nombre, proveedor: oc.proveedor }))
  );
}

export function getPrepackByEpc(epc) {
  return getAllPrepacks().find((p) => p.epc === epc);
}

// ============================================
// COLORES (mantienen compatibilidad)
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