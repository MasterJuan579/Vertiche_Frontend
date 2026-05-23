/**
 * Vertiche SortFlow — Mock Auth Utilities
 *
 * This mocks the Cognito-based auth flow without making real Cognito calls.
 * In production, replace mockSignIn with a Cognito SDK call.
 *
 * Token handoff between apps uses URL fragments (#token=...) so the JWT
 * survives navigation across different Vercel deployments. The fragment is
 * read on first load, stored in sessionStorage, and cleared from the URL.
 */

const STORAGE_KEY = 'vertiche.auth';

// Map roles to target module URLs. In production these would be subdomains
// of a custom domain. For local dev and Vercel free tier, use the .vercel.app URLs.
export const ROLE_DESTINATIONS = {
  SUPERVISOR: import.meta.env?.VITE_RFID_URL || 'http://localhost:5174',
  BAY_OPERATOR: import.meta.env?.VITE_SORTER_URL || 'http://localhost:5175',
  OPS_MANAGER: import.meta.env?.VITE_DASHBOARD_URL || 'http://localhost:5176',
  QA_INSPECTOR: import.meta.env?.VITE_PROVEEDORES_URL || 'http://localhost:5177',
};

export const AUTH_URL =
  import.meta.env?.VITE_AUTH_URL || 'http://localhost:5173';

// Build a fake JWT for development. Real implementation would receive this
// from Cognito after sign-in.
function buildMockToken(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.sub,
      email: user.email,
      name: user.name,
      'custom:role': user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  // Fake signature — real Cognito tokens are HMAC-signed
  const signature = btoa(`mock-signature-${user.sub}`);
  return `${header}.${payload}.${signature}`;
}

function decodeMockToken(token) {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function mockSignIn(user) {
  const token = buildMockToken(user);
  saveSession({ token, user });
  return { token, user };
}

export function getSession() {
  // First, check if there's a token in the URL fragment (just arrived from auth)
  if (typeof window !== 'undefined' && window.location.hash) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');
    if (token) {
      const claims = decodeMockToken(token);
      if (claims) {
        const user = {
          sub: claims.sub,
          email: claims.email,
          name: claims.name,
          role: claims['custom:role'],
        };
        saveSession({ token, user });
        // Clean the URL — the token is now in sessionStorage
        window.history.replaceState(null, '', window.location.pathname);
        return { token, user };
      }
    }
  }

  // Otherwise read from sessionStorage
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function redirectToModule(role, token) {
  const url = ROLE_DESTINATIONS[role];
  if (!url) {
    console.warn(`No destination configured for role: ${role}`);
    return;
  }
  window.location.href = `${url}/#token=${encodeURIComponent(token)}`;
}

export function logout() {
  clearSession();
  window.location.href = AUTH_URL;
}

// Hook-style helper for protected routes — checks role and redirects if mismatched
export function ensureRole(expectedRole) {
  const session = getSession();
  if (!session) {
    window.location.href = AUTH_URL;
    return null;
  }
  if (session.user.role !== expectedRole) {
    // User has a valid session but wrong role for this module
    const correctUrl = ROLE_DESTINATIONS[session.user.role];
    if (correctUrl) {
      window.location.href = `${correctUrl}/#token=${encodeURIComponent(
        session.token
      )}`;
    } else {
      window.location.href = AUTH_URL;
    }
    return null;
  }
  return session;
}
