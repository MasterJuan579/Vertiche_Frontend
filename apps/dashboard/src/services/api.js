const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = {
  async get(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
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

