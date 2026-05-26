// rfid/src/data/demoLecturas.js
import { realApi } from '../services/realApi';

// ============================================
// DATOS REALES (se llenan desde la API)
// ============================================

export let LECTURAS_INICIALES = [];
export let ANOMALIAS_INICIALES = [];

// ============================================
// FUNCIÓN PARA CARGAR DATOS DEL BACKEND
// ============================================

export async function cargarLecturasReales() {
  try {
    const [lecturas, anomalias] = await Promise.all([
      realApi.getLecturas(),
      realApi.getAnomalias()
    ]);
    
    LECTURAS_INICIALES.length = 0;
    LECTURAS_INICIALES.push(...lecturas);
    
    ANOMALIAS_INICIALES.length = 0;
    ANOMALIAS_INICIALES.push(...anomalias);
    
    console.log(`✅ Cargadas ${lecturas.length} lecturas y ${anomalias.length} anomalías`);
    return true;
  } catch (error) {
    console.error('Error cargando lecturas reales:', error);
    return false;
  }
}

// ============================================
// FUNCIONES AUXILIARES (mantienen compatibilidad)
// ============================================

export function getContadores() {
  return {
    preregistro: LECTURAS_INICIALES.filter((e) => e.etapa === 'PREREGISTRO').length,
    bahia:       LECTURAS_INICIALES.filter((e) => e.etapa === 'BAHIA').length,
    anomalias:   ANOMALIAS_INICIALES.length,
    duplicados:  LECTURAS_INICIALES.filter((e) => e.es_duplicado).length,
  };
}

export const STAGES = [...new Set(LECTURAS_INICIALES.map(l => l.etapa))];