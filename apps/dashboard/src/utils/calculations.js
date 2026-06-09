import { STAGES } from './constants';

const _warned = new Set();
function warnOnce(key, message, sample) {
  if (_warned.has(key)) return;
  _warned.add(key);
  // eslint-disable-next-line no-console
  console.warn(`[dashboard] ${message}`, sample);
}

export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function isActiveAnomaly(anomalia) {
  return !(anomalia?.resuelto === true || anomalia?.resuelto === 'true');
}

export function getCumplimiento(pedidos, tags = []) {
  if (pedidos.length > 0) {
    const sample = pedidos[0];
    if (sample.total_esperados === undefined && sample.totalEsperados === undefined)
      warnOnce('pedido.esperados', 'getCumplimiento: ningún pedido tiene total_esperados ni totalEsperados', sample);
    if (sample.total_recibidos === undefined && sample.totalRecibidos === undefined)
      warnOnce('pedido.recibidos', 'getCumplimiento: ningún pedido tiene total_recibidos ni totalRecibidos', sample);
  }

  const totalEsperados = pedidos.reduce(
    (sum, pedido) => sum + toNumber(pedido.total_esperados ?? pedido.totalEsperados),
    0,
  );
  const totalRecibidos = pedidos.reduce((sum, pedido) => {
    const dbRecibidos = toNumber(pedido.total_recibidos ?? pedido.totalRecibidos);
    if (dbRecibidos > 0) return sum + dbRecibidos;

    // Fallback dinámico: contar tags reales asociados a este pedido que ya han sido vinculados (no son PENDIENTE-...)
    const realTagsCount = tags.filter(
      (t) =>
        String(t.pedido_id ?? t.pedidoId) === String(pedido.pedido_id ?? pedido.pedidoId) &&
        !String(t.epc ?? '').startsWith('PENDIENTE'),
    ).length;
    return sum + realTagsCount;
  }, 0);

  return {
    totalEsperados,
    totalRecibidos,
    porcentaje: totalEsperados > 0 ? (totalRecibidos / totalEsperados) * 100 : null,
  };
}

export function getEstadoOperativo({ anomalias, eventos }) {
  const activas = anomalias.filter(isActiveAnomaly).length;
  const recientes = getRecentEvents(eventos, 5).length;

  if (activas > 5) return { label: 'Crítico', status: 'critical', detail: `${activas} anomalías activas` };
  if (activas > 0) return { label: 'Atención', status: 'warning', detail: `${activas} anomalías activas` };
  if (recientes === 0) return { label: 'Sin lecturas', status: 'idle', detail: 'Sin eventos recientes' };
  return { label: 'Operativo', status: 'ok', detail: `${recientes} lecturas recientes` };
}

export function getRecentEvents(eventos, minutes = 5) {
  if (eventos.length === 0) return [];

  // Encontrar el timestamp del evento más reciente en el dataset
  const timestamps = eventos
    .map((e) => {
      const rawDate = e.timestamp ?? e.fecha_hora ?? e.createdAt;
      const date = rawDate ? new Date(rawDate) : null;
      return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
    })
    .filter((t) => t > 0);

  // Si los eventos son históricos (por ejemplo, el más reciente tiene más de 12 horas)
  // consideramos el evento más reciente como el "ahora" para que el dashboard muestre datos
  const maxEventTime = timestamps.length > 0 ? Math.max(...timestamps) : 0;
  const now = maxEventTime > 0 && Date.now() - maxEventTime > 12 * 60 * 60 * 1000
    ? maxEventTime
    : Date.now();

  const windowMs = minutes * 60 * 1000;

  return eventos.filter((evento) => {
    const rawDate = evento.timestamp ?? evento.fecha_hora ?? evento.createdAt;
    const date = rawDate ? new Date(rawDate) : null;
    if (!date || Number.isNaN(date.getTime())) return false;
    const diff = now - date.getTime();
    return diff >= 0 && diff <= windowMs;
  });
}

export function normalizeStage(value) {
  return String(value ?? '').trim().toUpperCase();
}

export function matchesAnyStage(entity, stage) {
  const expected = normalizeStage(stage);
  return [
    entity?.etapa_actual,
    entity?.etapa,
    entity?.estado,
    entity?.ubicacion,
    entity?.zona,
    entity?.bahia,
    entity?.caja_id,
    entity?.cajaId,
    entity?.palet_id,
    entity?.paletId,
    entity?.lector_id,
    entity?.lectorId,
  ].some((value) => normalizeStage(value).includes(expected));
}

export function getStageItems(stageKey, data) {
  switch (stageKey) {
    case 'preregistro':
      return data.palets.filter(
        (palet) => matchesAnyStage(palet, 'PREREGISTRO') || normalizeStage(palet.estado).includes('ESPERANDO'),
      );
    case 'qa':
      return data.inspecciones.length > 0
        ? data.inspecciones
        : data.tags.filter((tag) => matchesAnyStage(tag, 'QA'));
    case 'registro':
      return data.tags.filter(
        (tag) => matchesAnyStage(tag, 'REGISTRO') || normalizeStage(tag.etapa_actual) === 'REGISTRADO',
      );
    case 'sorter':
      return getRecentEvents(data.eventos, 5).filter((evento) => matchesAnyStage(evento, 'SORTER') || matchesAnyStage(evento, 'SORTING'));
    case 'bahia':
      return [
        ...data.eventos.filter((evento) => matchesAnyStage(evento, 'PACKING') || matchesAnyStage(evento, 'BAHIA')),
        ...data.cajas.filter((caja) => caja.estado === 'ABIERTA' || caja.estado === 'EN_LLENADO' || caja.estado === 'SELLADA'),
      ];
    case 'auditoria':
      return data.tags.filter(
        (tag) => matchesAnyStage(tag, 'AUDITORIA') || normalizeStage(tag.etapa_actual) === 'APROBADO' || normalizeStage(tag.estado).includes('APROBADO'),
      );
    case 'envio':
      return data.cajas.filter((caja) => matchesAnyStage(caja, 'ENVIO') || normalizeStage(caja.estado).includes('ENVIADA'));
    default:
      return [];
  }
}

export function getStageStats(data) {
  const max = Math.max(1, ...STAGES.map((stage) => getStageItems(stage.key, data).length));
  return STAGES.map((stage) => {
    const count = getStageItems(stage.key, data).length;
    return {
      ...stage,
      count,
      percentage: Math.round((count / max) * 100),
    };
  });
}

export function getThroughputBuckets(eventos) {
  const counts = new Map();

  eventos.forEach((evento) => {
    const rawDate = evento.timestamp ?? evento.fecha_hora ?? evento.createdAt;
    const date = rawDate ? new Date(rawDate) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    const key = `${String(date.getHours()).padStart(2, '0')}:00`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  if (counts.size === 0) return [];

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, lecturas]) => ({ hora, lecturas }));
}

export function getOperators(inspecciones) {
  return Array.from(
    new Set(
      inspecciones
        .map((item) => item.operador_id ?? item.operador ?? item.inspector ?? item.usuario)
        .filter(Boolean),
    ),
  );
}
