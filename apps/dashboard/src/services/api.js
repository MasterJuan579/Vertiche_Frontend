import { apiGet } from '@vertiche/design-system';

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

function classifyError(err) {
  if (!err) return { type: 'unknown', message: 'Error desconocido' };
  if (err.status === 0) {
    return { type: 'network', message: 'No se pudo conectar con el servidor. Verifica tu red o que el backend esté activo.' };
  }
  if (err.status === 404) {
    return { type: 'not_found', message: 'Recurso no encontrado (404).' };
  }
  if (err.status >= 500) {
    return { type: 'server', message: err.detail || err.message || `Error del servidor (${err.status})` };
  }
  return {
    type: 'request',
    message: err.detail || err.message || `Error HTTP ${err.status || ''}`,
  };
}

async function getList(endpoint) {
  try {
    return normalizeList(await apiGet(endpoint));
  } catch (err) {
    const classified = classifyError(err);
    if (classified.type === 'not_found') return [];
    throw { ...err, ...classified, endpoint };
  }
}

export const api = {
  get: getList,
};

export const ENDPOINTS = {
  tags: '/Tag/listarTags',
  palets: '/Palet/listarPalets',
  pedidos: '/Pedido/listarPedidos',
  inspecciones: '/InspeccionQA/listarInspecciones',
  anomalias: '/Anomalia/listarAnomalias',
  eventos: '/EventoLectura/listarLecturas',
  cajas: '/Caja/listarCajas',
  tiendas: '/Tienda/listarTiendas',
  proveedores: '/Proveedor/listarProveedores',
};
