const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:8080';

// Storage key + token field are owned by auth.jsx ('vertiche.auth' / idToken);
// mirror design-system/api.js — never introduce a second key/field.
const STORAGE_KEY = 'vertiche.auth';

function authHeader() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const { idToken } = JSON.parse(raw);
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
  } catch {
    return {};
  }
}

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
        ...authHeader(),
        ...(options.headers || {}),
      },
    });
  } catch (e) {
    throw new ApiError('network', 0, `No se pudo alcanzar ${url}`, { cause: e?.message });
  }
  if (res.status === 401) {
    // Expired/missing token — clear the session and bounce to login.
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = '/';
    throw new ApiError('http', 401, 'Sesión expirada', null);
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
