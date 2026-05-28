import { apiFetch } from './client.js';

export function listTiendas() {
  return apiFetch('/Tienda/listarTiendas');
}

export function getTienda(tiendaId) {
  return apiFetch(`/Tienda/${encodeURIComponent(tiendaId)}`);
}
