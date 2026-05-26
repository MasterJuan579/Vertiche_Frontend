// rfid/src/data/demoOCs.js
import { realApi } from '../services/realApi';

// ============================================
// CONSTANTES
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
// FUNCIÓN PARA CARGAR DATOS REALES DEL BACKEND
// ============================================

export async function cargarDatosReales() {
  try {
    // Obtener órdenes del backend
    const ocs = await realApi.getOrdenesCompra();
    
    console.log('📦 Órdenes recibidas del backend:', ocs);
    
    if (!ocs || ocs.length === 0) {
      console.warn('No hay órdenes en el backend');
      DEMO_OCS.length = 0;
      return false;
    }
    
    // Usar los datos que ya vienen del backend (con etapasActivas, tagsPorEtapa, etc.)
    DEMO_OCS.length = 0;
    DEMO_OCS.push(...ocs);
    
    // Calcular KPI básico desde las órdenes
    const totalOrdenes = ocs.length;
    const ordenesCompletadas = ocs.filter((oc) => oc.estado === 'COMPLETADA').length;
    const pctCompletadas = totalOrdenes > 0 ? (ordenesCompletadas / totalOrdenes) * 100 : 0;
    
    DEMO_KPI = {
      mejora_porcentaje: 30.6,
      objetivo_mejora_pct: 32,
      tiempo_promedio_hoy_min: 125,
      palets_activos: totalOrdenes,
      palets_completados_hoy: ordenesCompletadas
    };
    
    console.log(`✅ Cargadas ${DEMO_OCS.length} órdenes de compra`);
    console.log('Primera orden:', DEMO_OCS[0]);
    
    return true;
  } catch (error) {
    console.error('Error cargando datos reales:', error);
    return false;
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

export function getOC(ordenId) {
  return DEMO_OCS.find((oc) => oc.orden_id === ordenId);
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
    (oc.tags || []).map((t) => ({ 
      ...t, 
      ordenId: oc.orden_id, 
      ocNombre: oc.nombre_producto, 
      proveedor: oc.Proveedor?.nombre 
    }))
  );
}

export function getPrepackByEpc(epc) {
  return getAllPrepacks().find((p) => p.epc === epc);
}

// ============================================
// COLORES
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