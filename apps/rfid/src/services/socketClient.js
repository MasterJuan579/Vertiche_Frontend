// rfid/src/services/socketClient.js
// Cliente Socket.IO singleton. Las pantallas se suscriben con useEffect
// y reciben eventos del backend en tiempo real:
//   - 'lectura'  → nueva lectura RFID procesada
//   - 'anomalia' → nueva anomalía detectada
//   - 'tag'      → tag con etapa_actual / qa_fallido actualizado
//
// Uso típico:
//   useEffect(() => {
//     const off = onSocket('lectura', (ev) => setEventos((prev) => [ev, ...prev]));
//     return off;
//   }, []);

import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

let socket = null;

function getSocket() {
  if (socket) return socket;
  socket = io(API_BASE, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
  });
  socket.on('connect', () => console.log('[socket] conectado', socket.id));
  socket.on('disconnect', (reason) => console.log('[socket] desconectado', reason));
  socket.on('connect_error', (err) => console.warn('[socket] error de conexión:', err.message));
  return socket;
}

/**
 * Suscribe un handler a un evento. Devuelve la función de cleanup.
 * Llamar el cleanup en el `return` del useEffect.
 */
export function onSocket(event, handler) {
  const s = getSocket();
  s.on(event, handler);
  return () => s.off(event, handler);
}

/** Útil para debugging / status banner. */
export function isSocketConnected() {
  return socket?.connected === true;
}
