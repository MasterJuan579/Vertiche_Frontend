/**
 * Vertiche SortFlow — Authenticated backend client
 *
 * Thin wrapper over `fetch` for backend calls that need the Cognito id token.
 * Reads the token from the same sessionStorage entry the AuthProvider writes
 * ('vertiche.auth'), attaches `Authorization: Bearer <idToken>`, and prefixes
 * the path with VITE_API_URL.
 *
 * On 401 it assumes the token expired or was revoked: it clears the local
 * session and bounces to the login page. All other non-2xx responses throw an
 * error of shape { status, error, detail? } that callers can branch on.
 *
 * Env: VITE_API_URL (e.g. http://localhost:8080)
 */

// Must match STORAGE_KEY in auth.jsx — the AuthProvider owns this entry.
const STORAGE_KEY = 'vertiche.auth';

const API_URL = import.meta.env.VITE_API_URL || '';

function getIdToken() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session && session.idToken ? session.idToken : null;
  } catch {
    return null;
  }
}

/**
 * Clear the session and redirect to login. Called on 401. We can't import the
 * AuthProvider here (it imports us), so we clear storage directly and do a hard
 * navigation — that also resets all in-memory React state cleanly.
 */
function forceSignOut() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — navigation below still resets state.
  }
  if (typeof window !== 'undefined') {
    window.location.assign('/');
  }
}

/**
 * Core request. Returns parsed JSON on 2xx (or null for 204/empty bodies).
 * Throws { status, error, detail? } on any other status.
 */
export async function apiFetch(path, options = {}) {
  const token = getIdToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw { status: 0, error: 'network_error', detail: 'Could not reach the server.' };
  }

  if (res.status === 401) {
    forceSignOut();
    throw { status: 401, error: 'unauthorized' };
  }

  // Parse the body once; some endpoints return empty bodies (e.g. 204).
  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    throw {
      status: res.status,
      error: (body && body.error) || 'request_failed',
      detail: body && body.detail ? body.detail : body,
    };
  }

  return body;
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export function apiGet(path, options) {
  return apiFetch(path, { ...options, method: 'GET' });
}

export function apiPost(path, data, options) {
  return apiFetch(path, {
    ...options,
    method: 'POST',
    body: data != null ? JSON.stringify(data) : undefined,
  });
}

export function apiDelete(path, options) {
  return apiFetch(path, { ...options, method: 'DELETE' });
}
