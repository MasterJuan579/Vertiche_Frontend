import { STAGES } from './constants';

export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function isActiveAnomaly(anomalia) {
  return !(anomalia?.resuelto === true || anomalia?.resuelto === 'true');
}

export function getCumplimiento(pedidos) {
  const totalEsperados = pedidos.reduce(
    (sum, pedido) => sum + toNumber(pedido.total_esperados ?? pedido.totalEsperados),
    0,
  );
  const totalRecibidos = pedidos.reduce(
    (sum, pedido) => sum + toNumber(pedido.total_recibidos ?? pedido.totalRecibidos),
    0,
  );

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
  const now = Date.now();
  const windowMs = minutes * 60 * 1000;

  return eventos.filter((evento) => {
    const rawDate = evento.timestamp ?? evento.fecha_hora ?? evento.createdAt;
    const date = rawDate ? new Date(rawDate) : null;
    if (!date || Number.isNaN(date.getTime())) return true;
    return now - date.getTime() <= windowMs;
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
        (tag) => matchesAnyStage(tag, 'REGISTRO') || normalizeStage(tag.estado).includes('REGISTRADO'),
      );
    case 'sorter':
      return getRecentEvents(data.eventos, 5).filter((evento) => matchesAnyStage(evento, 'SORTER') || matchesAnyStage(evento, 'SORTING'));
    case 'bahia':
      return [
        ...data.eventos.filter((evento) => matchesAnyStage(evento, 'PACKING') || matchesAnyStage(evento, 'BAHIA')),
        ...data.cajas.filter((caja) => matchesAnyStage(caja, 'BAHIA') || matchesAnyStage(caja, 'PACKING')),
      ];
    case 'auditoria':
      return data.tags.filter(
        (tag) => matchesAnyStage(tag, 'AUDITORIA') || normalizeStage(tag.estado).includes('APROBADO'),
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
    const hour = date && !Number.isNaN(date.getTime()) ? date.getHours() : null;
    const key = hour === null ? '--' : `${String(hour).padStart(2, '0')}:00`;
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
        .map((item) => item.operador ?? item.inspector ?? item.usuario)
        .filter(Boolean),
    ),
  );
}

