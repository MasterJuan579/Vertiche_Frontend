import { useEffect, useRef } from 'react';

/**
 * Hook opcional para recibir eventos en vivo vía Socket.IO.
 *
 * Requiere instalar `socket.io-client` en el workspace del dashboard:
 *   npm install socket.io-client --workspace=dashboard
 *
 * Se conecta al mismo VITE_API_URL y escucha los eventos que el backend emite:
 *   - 'lectura'  → nueva lectura RFID
 *   - 'anomalia' → nueva anomalía detectada
 *   - 'tag'      → tag actualizado (etapa, qa_fallido)
 *
 * Cada vez que llega un evento se ejecuta `onEvent(type, payload)`.
 * El caller (por ejemplo useDashboardData) puede decidir si refresca todo
 * o actualiza solo el slice afectado.
 */
export function useRealtime(onEvent) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let socket;
    let cancelled = false;

    const API_URL = import.meta.env.VITE_API_URL || '';
    if (!API_URL) return;

    (async () => {
      let io;
      try {
        ({ io } = await import('socket.io-client'));
      } catch {
        // eslint-disable-next-line no-console
        console.info('[useRealtime] socket.io-client no instalado — se usa polling como fallback');
        return;
      }
      if (cancelled) return;

      socket = io(API_URL, {
        transports: ['websocket', 'polling'],
        reconnectionDelay: 3000,
      });

      const events = ['lectura', 'anomalia', 'tag'];
      events.forEach((event) => {
        socket.on(event, (payload) => {
          // eslint-disable-next-line no-console
          console.log(`[realtime] ${event}`, payload);
          onEventRef.current?.(event, payload);
        });
      });

      socket.on('connect', () => {
        // eslint-disable-next-line no-console
        console.log('[realtime] conectado');
      });

      socket.on('connect_error', (err) => {
        // eslint-disable-next-line no-console
        console.warn('[realtime] error de conexión:', err.message);
      });
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, []);
}
