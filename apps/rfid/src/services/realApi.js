// rfid/src/services/realApi.js

// Usa la variable de entorno del monorepo, con fallback para pruebas locales
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const realApi = {
  // ============================================
  // ÓRDENES DE COMPRA
  // ============================================
  
  async getOrdenesCompra() {
    try {
      const res = await fetch(`${API_BASE}/OrdenCompra/listarOrdenes`);
      if (!res.ok) throw new Error('Error al obtener órdenes');
      const data = await res.json();
      
      // Transformar al formato que espera el frontend (demoOCs.js)
      return data.map(oc => ({
        ordenId: oc.orden_id,
        nombre: oc.nombre_producto || `OC ${oc.orden_id}`,
        proveedor: oc.Proveedor?.nombre || 'Proveedor',
        totalPrepacks: oc.total_esperados || 0,
        total_recibidos: oc.total_recibidos || 0,
        faltantes: (oc.total_esperados || 0) - (oc.total_recibidos || 0),
        estado: oc.estado || 'ACTIVO',
        pct: oc.total_esperados > 0 ? ((oc.total_recibidos || 0) / oc.total_esperados) * 100 : 0,
        hasErr: false,
        tags: [],
        tagsPorEtapa: {},
        etapasActivas: [],
        idxMin: 0,
        idxMax: 6,
        etapa_logs: []
      }));
    } catch (error) {
      console.error('Error en getOrdenesCompra:', error);
      return [];
    }
  },

  // ============================================
  // LECTURAS RFID
  // ============================================
  
  async getLecturas() {
    try {
      const res = await fetch(`${API_BASE}/EventoLectura/listarLecturas`);
      if (!res.ok) throw new Error('Error al obtener lecturas');
      const lecturas = await res.json();
      
      return lecturas.map(l => ({
        id: l.id,
        epc: l.epc,
        etapa: l.etapa,
        lector: l.lector_id,
        tiempo: l.timestamp,
        es_duplicado: l.es_duplicado || false,
        detalle: l.etapa
      }));
    } catch (error) {
      console.error('Error en getLecturas:', error);
      return [];
    }
  },

  // ============================================
  // ANOMALÍAS
  // ============================================
  
  async getAnomalias() {
    try {
      const res = await fetch(`${API_BASE}/Anomalia/listarAnomalias`);
      if (!res.ok) throw new Error('Error al obtener anomalías');
      const anomalias = await res.json();
      
      return anomalias
        .filter(a => !a.resuelto)
        .map(a => ({
          id: a.id,
          tipo: a.tipo_error,
          epc: a.epc,
          etapa: a.etapa,
          bahia: a.bahia,
          bahia_esperada: a.bahia_esperada,
          tiempo: a.timestamp,
          descripcion: a.descripcion
        }));
    } catch (error) {
      console.error('Error en getAnomalias:', error);
      return [];
    }
  },

  // ============================================
  // TAGS (PREPACKS)
  // ============================================
  
  async getTags() {
    try {
      const res = await fetch(`${API_BASE}/Tag/listarTags`);
      if (!res.ok) throw new Error('Error al obtener tags');
      return await res.json();
    } catch (error) {
      console.error('Error en getTags:', error);
      return [];
    }
  },

  async crearTag(tagData) {
    try {
      const res = await fetch(`${API_BASE}/Tag/crearTag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData)
      });
      return await res.json();
    } catch (error) {
      console.error('Error en crearTag:', error);
      return { error: error.message };
    }
  },

  async getTagByEpc(epc) {
    try {
      const res = await fetch(`${API_BASE}/Tag/${epc}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('Error en getTagByEpc:', error);
      return null;
    }
  },

  // ============================================
  // TIENDAS Y PROVEEDORES
  // ============================================
  
  async getTiendas() {
    try {
      const res = await fetch(`${API_BASE}/Tienda/listarTiendas`);
      if (!res.ok) throw new Error('Error al obtener tiendas');
      return await res.json();
    } catch (error) {
      console.error('Error en getTiendas:', error);
      return [];
    }
  },

  async getProveedores() {
    try {
      const res = await fetch(`${API_BASE}/Proveedor/listarProveedores`);
      if (!res.ok) throw new Error('Error al obtener proveedores');
      return await res.json();
    } catch (error) {
      console.error('Error en getProveedores:', error);
      return [];
    }
  },

  // ============================================
  // ESTADÍSTICAS (si tienes RfidController)
  // ============================================
  
  async getEstadisticas() {
    try {
      const res = await fetch(`${API_BASE}/rfid/estadisticas`);
      if (!res.ok) throw new Error('Error al obtener estadísticas');
      return await res.json();
    } catch (error) {
      console.error('Error en getEstadisticas (opcional):', error);
      // Retorna valores por defecto si el endpoint no existe
      return {
        lecturas_hoy: 0,
        palets_completados_hoy: 0,
        anomalias_pendientes: 0,
        total_tags: 0,
        tags_por_etapa: []
      };
    }
  },

  // ============================================
  // PROCESAR LECTURA EN TIEMPO REAL (si tienes RfidController)
  // ============================================
  
  async procesarLectura(lecturaData) {
    try {
      const res = await fetch(`${API_BASE}/rfid/lectura`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lecturaData)
      });
      return await res.json();
    } catch (error) {
      console.error('Error en procesarLectura:', error);
      return { success: false, error: error.message };
    }
  }
  
};