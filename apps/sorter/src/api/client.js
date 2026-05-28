const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:8080';

export class ApiError extends Error {
  constructor(kind, status, message, payload) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (e) {
    throw new ApiError('network', 0, `No se pudo alcanzar ${url}`, { cause: e?.message });
  }
  if (!res.ok) {
    let payload = null;
    try { payload = await res.json(); } catch { /* not json */ }
    throw new ApiError('http', res.status, payload?.message || res.statusText, payload);
  }
  return res.json();
}

export function getApiBaseUrl() {
  return BASE_URL;
}
