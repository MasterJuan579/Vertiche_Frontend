import { useCallback, useEffect, useState } from 'react';

const SORTER_HISTORY_LIMIT = 24;
const CAJA_HISTORY_LIMIT = 18;

export function useSorterRealtime() {
  const [liveStatus, setLiveStatus] = useState('connecting');
  const [sorterCurrent, setSorterCurrent] = useState(null);
  const [sorterHistory, setSorterHistory] = useState([]);
  const [sorterTotal, setSorterTotal] = useState(0);
  const [cajaCurrent, setCajaCurrent] = useState(null);
  const [cajaHistory, setCajaHistory] = useState([]);

  const processSorterScan = useCallback((payload) => {
    const prepack = normalizeSorterScan(payload);
    if (!prepack) return;

    setSorterCurrent(prepack);
    setSorterTotal((total) => total + 1);
    setSorterHistory((history) => prependUnique(history, prepack, SORTER_HISTORY_LIMIT));
  }, []);

  const processCajaScan = useCallback((payload) => {
    const prepack = normalizeCajaScan(payload);
    if (!prepack) return;

    setCajaCurrent(prepack);
    setCajaHistory((history) => prependUnique(history, prepack, CAJA_HISTORY_LIMIT));
  }, []);

  useEffect(() => {
    let socket;
    let cancelled = false;
    const apiUrl = import.meta.env.VITE_API_URL || '';

    if (!apiUrl) {
      setLiveStatus('demo');
      return undefined;
    }

    (async () => {
      try {
        const { io } = await import('socket.io-client');
        if (cancelled) return;

        socket = io(apiUrl, {
          transports: ['websocket', 'polling'],
          reconnectionDelay: 800,
          reconnectionDelayMax: 2500,
        });

        socket.on('connect', () => setLiveStatus('live'));
        socket.on('disconnect', () => setLiveStatus('connecting'));
        socket.on('connect_error', () => setLiveStatus('connecting'));
        socket.on('sorter-scan', processSorterScan);
        socket.on('sorter-caja-scan', processCajaScan);
        socket.on('sorter-caja-pick', processCajaScan);
      } catch {
        if (!cancelled) setLiveStatus('demo');
      }
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [processCajaScan, processSorterScan]);

  return {
    liveStatus,
    sorter: {
      current: sorterCurrent,
      history: sorterHistory,
      totalScanned: sorterTotal,
    },
    caja: {
      current: cajaCurrent,
      history: cajaHistory,
    },
  };
}

function prependUnique(history, scan, limit) {
  if (history[0]?.id === scan.id) return history;
  return [scan, ...history.filter((item) => item.id !== scan.id)].slice(0, limit);
}

function normalizeSorterScan(payload) {
  if (!payload) return null;

  const prepack = payload.prepack || payload.sorterPrepack || {};
  const tag = prepack.tag || payload.tag || {};
  const tienda = prepack.tienda || tag.tienda || tag.Tienda || null;
  const etapa = String(payload.etapa || payload.lectura?.etapa || '').toUpperCase();
  if (etapa && etapa !== 'SORTING') return null;

  const epc = prepack.epc || tag.epc || payload.epc;
  if (!epc) return null;

  const destinationBay = parseBayNumber(
    prepack.correctBay ||
      prepack.correct_bay ||
      prepack.bahiaDestino ||
      tag.correctBay ||
      tag.correct_bay ||
      tienda?.bahia_asignada
  );
  const detectedBay = parseBayNumber(
    prepack.bayNumber ||
      prepack.bahiaActual ||
      prepack.bahia_actual ||
      payload.bahiaActual ||
      payload.bahia_actual
  );
  const bayNumber = destinationBay || detectedBay || parseBayNumber(payload.bahia) || 0;
  const id = payload.lectura_id || payload.id || `${epc}-${payload.timestamp || Date.now()}`;

  return {
    epc,
    scanId: id,
    id,
    scannedAt: toTimestamp(payload.timestamp),
    orden_id: prepack.orden_id || tag.orden_id || tag.pedido_id || '---',
    producto: prepack.producto || tag.producto || tag.sku || 'Prepack sin detalle',
    proveedor: prepack.proveedor || tag.proveedor?.nombre || tag.Proveedor?.nombre || '---',
    tienda,
    bayNumber,
    correctBay: destinationBay || bayNumber,
    cajaDestino: prepack.cajaDestino || null,
    isMisrouted: Boolean(detectedBay && destinationBay && detectedBay !== destinationBay),
    prendas: normalizePrendas(prepack.prendas, tag),
    colores: tag.color ? [tag.color] : [],
    tallas: tag.talla ? [tag.talla] : [],
    total_prendas: Number(tag.cantidad_piezas) || 1,
    color: tag.color || '---',
    talla: tag.talla || '---',
    qa_fallido: Boolean(prepack.qa_fallido || tag.qa_fallido),
    tipo_flujo: prepack.tipo_flujo || tag.tipo_flujo || 'CROSS_DOCK',
  };
}

function normalizeCajaScan(payload) {
  if (!payload) return null;

  const tag = payload.tag || {};
  const tienda = payload.tienda || tag.tienda || null;
  const epc = payload.epc || tag.epc;
  const cajaDestino = parseCajaNumber(payload.cajaDestino || payload.caja_id);
  if (!epc || !cajaDestino) return null;

  const bahiaActual = parseBayNumber(
    payload.bahiaActual ||
      payload.bahia ||
      payload.caja_id ||
      tag.correctBay ||
      tienda?.bahia_asignada
  );
  if (!bahiaActual) return null;

  const id = payload.lectura_id || payload.id || `${epc}-${payload.timestamp || Date.now()}`;
  return {
    epc,
    scanId: id,
    id,
    scannedAt: toTimestamp(payload.timestamp),
    orden_id: payload.orden_id || tag.orden_id || tag.pedido_id || '---',
    producto: payload.producto || tag.producto || tag.sku || 'Prepack sin detalle',
    tienda,
    correctBay: bahiaActual,
    bahiaActual,
    cajaDestino,
    caja_id: payload.caja_id || null,
    color: tag.color || '---',
    talla: tag.talla || '---',
    total_prendas: Number(tag.cantidad_piezas) || 1,
    qa_fallido: Boolean(tag.qa_fallido),
    tipo_flujo: tag.tipo_flujo || 'CROSS_DOCK',
  };
}

function parseBayNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const match = value.match(/BAHIA-(\d+)|\b(\d+)\b/i);
  if (!match) return null;
  const n = Number(match[1] || match[2]);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

function parseCajaNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const match = value.match(/CAJA-(\d+)|\bC(\d+)\b|\b(\d+)\b/i);
  if (!match) return null;
  const n = Number(match[1] || match[2] || match[3]);
  return Number.isFinite(n) && n >= 1 && n <= 3 ? n : null;
}

function normalizePrendas(prendas, tag) {
  if (Array.isArray(prendas) && prendas.length > 0) return prendas;
  const count = Math.max(1, Number(tag?.cantidad_piezas) || 1);
  return Array.from({ length: count }, () => ({
    color: tag?.color || '---',
    talla: tag?.talla || '---',
  }));
}

function toTimestamp(value) {
  const timestamp = value ? new Date(value).getTime() : Date.now();
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}
