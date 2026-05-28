import { apiFetch } from './client.js';

export function listTags() {
  return apiFetch('/Tag/listarTags');
}

export function listTagsCompletos() {
  return apiFetch('/Tag/listarTagsCompletos');
}

export function getTag(epc) {
  return apiFetch(`/Tag/${encodeURIComponent(epc)}`);
}
