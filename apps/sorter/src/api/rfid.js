import { apiFetch, getApiBaseUrl } from './client.js';

export function scanBahia(payload) {
  return apiFetch('/rfid/bahia/scan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function connectRealtime(handlers = {}) {
  const { io } = await import('socket.io-client');
  const socket = io(getApiBaseUrl(), {
    transports: ['websocket', 'polling'],
  });

  for (const [event, handler] of Object.entries(handlers)) {
    if (typeof handler === 'function') socket.on(event, handler);
  }

  return socket;
}
