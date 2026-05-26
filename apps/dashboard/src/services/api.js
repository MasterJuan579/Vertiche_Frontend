const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

export const api = {
  async get(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return normalizeList(await res.json());
  },
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
