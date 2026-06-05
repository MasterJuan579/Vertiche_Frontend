import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { escanearPrepack } from '../api/proveedores.js';

/**
 * Suscribe el componente a los dos eventos relevantes para inspección QA:
 *
 *   1. `lectura`     — lo emite el backend cada vez que el arco RFID detecta
 *                      un tag. Solo nos interesa si `etapa === 'QA'`. Cuando
 *                      lo es, llamamos automáticamente a POST /PlanQA/escanear
 *                      y pasamos la decisión al handler.
 *
 *   2. `qa-escaneo`  — atajo directo que el backend emite cuando ya pasó por
 *                      /PlanQA/escanear (ej. desde Postman). Llega listo para
 *                      consumirse.
 *
 * En ambos casos el handler `onScan` recibe el mismo shape — el del response
 * de /PlanQA/escanear — así OperatorScreen no necesita distinguir el origen.
 *
 * El handler puede cambiar entre renders sin que reconectemos el socket: lo
 * mantenemos detrás de un ref.
 *
 * Devuelve { connected } para mostrar el estado de la conexión en la UI.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useScanSocket(onScan) {
  const handlerRef = useRef(onScan);
  handlerRef.current = onScan;

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('connect', () => {
      console.log('[socket] conectado:', socket.id);
      setConnected(true);
    });
    socket.on('disconnect', (reason) => {
      console.log('[socket] desconectado:', reason);
      setConnected(false);
    });
    socket.on('connect_error', (err) => {
      console.warn('[socket] error de conexión:', err.message);
    });

    // ── Lectura RFID en bruto ─────────────────────────────────────
    socket.on('lectura', async (data) => {
      // El backend emite el payload PLANO (emit('lectura', lecturaPayload)),
      // con etapa/epc en la raíz. Aceptamos también la forma anidada
      // (data.lectura.*) por si el contrato cambia.
      const etapa = String(data?.etapa ?? data?.lectura?.etapa ?? '').trim().toUpperCase();
      if (etapa !== 'QA') {
        // Lecturas de otras etapas (CEDIS, bahías, etc.) no nos competen.
        return;
      }
      const epc = data?.epc ?? data?.lectura?.epc;
      if (!epc) {
        console.warn('[socket] lectura QA sin EPC:', data);
        return;
      }
      console.log('[socket] lectura QA recibida:', epc);
      try {
        const resultado = await escanearPrepack(epc);
        console.log('[socket] /PlanQA/escanear respuesta:', resultado);
        handlerRef.current?.(resultado);
      } catch (err) {
        console.error('[socket] error al consultar /PlanQA/escanear:', err);
      }
    });

    // ── Evento directo de QA (Postman / atajo del backend) ────────
    socket.on('qa-escaneo', (data) => {
      console.log('[socket] qa-escaneo recibido:', data);
      handlerRef.current?.(data);
    });

    return () => {
      socket.off('lectura');
      socket.off('qa-escaneo');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, []);

  return { connected };
}
