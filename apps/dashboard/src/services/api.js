import { apiGet } from '@vertiche/design-system';

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

async function getList(endpoint) {
  try {
    return normalizeList(await apiGet(endpoint));
  } catch (err) {
    if (err?.status === 404) return [];
    throw err;
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
