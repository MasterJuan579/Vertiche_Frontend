import { EMPTY_VALUE } from './constants';

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return EMPTY_VALUE;
  }
  return new Intl.NumberFormat('es-MX').format(Number(value));
}

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return EMPTY_VALUE;
  }
  return `${Number(value).toFixed(1)}%`;
}

export function formatDateTime(value) {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getField(entity, fields, fallback = EMPTY_VALUE) {
  const found = fields.find((field) => entity?.[field] !== undefined && entity?.[field] !== null);
  return found ? entity[found] : fallback;
}

