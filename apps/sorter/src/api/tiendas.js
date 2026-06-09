import { apiFetch } from './client.js';

export function listTiendas() {
  return apiFetch('/rfid/bahia/tiendas');
}

export function getTienda(tiendaId) {
  return apiFetch(`/Tienda/${encodeURIComponent(tiendaId)}`);
}
