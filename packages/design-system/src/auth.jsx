/**
 * Vertiche SortFlow — Auth context (real Cognito + backend)
 *
 * Sign-in is a two-hop flow:
 *   1. Cognito (USER_PASSWORD_AUTH) → id/access/refresh tokens, OR a
 *      NEW_PASSWORD_REQUIRED challenge for first-login users.
 *   2. GET /Auth/me with the id token → the user's role + name from MySQL.
 *      The role is NOT in Cognito; the backend is the source of truth.
 *
 * The session lives in React state and is mirrored to sessionStorage so a page
 * refresh doesn't log the user out. sessionStorage (not localStorage) means the
 * session is cleared when the browser tab closes.
 *
 * Session shape: { idToken, accessToken, refreshToken, user: { sub, email, role, nombre } }
 *   - accessToken is kept so signOut() can call Cognito's GlobalSignOut.
 *   - user.sub is the Cognito `sub` claim (== cognito_sub in MySQL), decoded
 *     from the id token since /Auth/me doesn't return it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Navigate } from 'react-router-dom';
import {
  initiateAuth,
  respondToNewPasswordChallenge,
  globalSignOut,
} from './cognito.js';

const STORAGE_KEY = 'vertiche.auth';

// Backend base URL. The /Auth/me probe below is done with a direct fetch (not
// the apiFetch wrapper) so we fully control 404/401 handling during login
// instead of triggering the wrapper's auto-redirect.
const API_URL = import.meta.env.VITE_API_URL || '';

// Where each role lives in the shell. Used by RequireRole to redirect a user
// who hits the wrong module to their correct one.
export const ROLE_HOMES = {
  ADMIN: '/admin',
  SUPERVISOR: '/rfid',
  BAY_OPERATOR: '/sorter',
  OPS_MANAGER: '/dashboard',
  QA_INSPECTOR: '/proveedores',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Decode the payload of a JWT without verifying it (the backend verifies; we
 * only need the `sub` claim for UI purposes). Returns {} on any malformed input.
 */
function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Context + provider
// ---------------------------------------------------------------------------

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // null until hydration finishes. We track "ready" separately so RequireRole
  // can show a loading state instead of redirecting on the first render.
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  // Hydrate from sessionStorage on first mount. Without this, a page refresh
  // would log the user out even though their token is still valid.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {
      // Corrupted JSON — treat as no session.
    }
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setSession(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // sessionStorage full or disabled — session still works in memory.
    }
  }, []);

  /**
   * Second hop of sign-in: given Cognito tokens, fetch the user's role from the
   * backend and install the session. Shared by signIn and completeNewPassword.
   * Returns { status: 'success' } | { status: 'error', code, message? }.
   */
  const establishSession = useCallback(
    async (tokens, loginEmail) => {
      let res;
      try {
        res = await fetch(`${API_URL}/Auth/me`, {
          headers: { Authorization: `Bearer ${tokens.idToken}` },
        });
      } catch {
        return { status: 'error', code: 'NetworkError' };
      }

      if (res.status === 404) {
        // Cognito knows the user but they aren't provisioned in MySQL.
        return { status: 'error', code: 'not_registered' };
      }
      if (!res.ok) {
        return {
          status: 'error',
          code: 'me_failed',
          message: `/Auth/me returned ${res.status}`,
        };
      }

      let me = {};
      try {
        me = await res.json();
      } catch {
        return { status: 'error', code: 'me_failed', message: 'Invalid /Auth/me response.' };
      }

      const claims = decodeJwtPayload(tokens.idToken);
      persist({
        idToken: tokens.idToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          sub: claims.sub,
          email: me.email || loginEmail,
          role: me.rol,
          nombre: me.nombre,
        },
      });
      return { status: 'success' };
    },
    [persist]
  );

  /**
   * Email/password sign-in. Returns:
   *   { status: 'success' }
   *   { status: 'challenge', challengeName, session, email }  (NEW_PASSWORD_REQUIRED)
   *   { status: 'error', code, message? }  (code: 'not_registered' | Cognito exception | ...)
   */
  const signIn = useCallback(
    async (email, password) => {
      const result = await initiateAuth(email, password);

      if (result.status === 'challenge') {
        return {
          status: 'challenge',
          challengeName: result.challengeName,
          session: result.session,
          email,
        };
      }
      if (result.status === 'error') {
        return result;
      }
      return establishSession(result.tokens, email);
    },
    [establishSession]
  );

  /**
   * Answer the NEW_PASSWORD_REQUIRED challenge, then complete sign-in exactly
   * like signIn's success path. `cognitoSession` is the Session string returned
   * by the original initiateAuth challenge.
   */
  const completeNewPassword = useCallback(
    async (email, newPassword, cognitoSession) => {
      const result = await respondToNewPasswordChallenge(
        email,
        newPassword,
        cognitoSession
      );
      if (result.status === 'error') {
        return result;
      }
      if (result.status !== 'success') {
        return { status: 'error', code: 'UnexpectedResponse' };
      }
      return establishSession(result.tokens, email);
    },
    [establishSession]
  );

  const signOut = useCallback(async () => {
    // Best-effort server-side revocation; clear locally regardless of outcome.
    if (session && session.accessToken) {
      await globalSignOut(session.accessToken);
    }
    setSession(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }, [session]);

  // useMemo prevents the context value from changing on every render, which
  // would force every consumer to re-render.
  const value = useMemo(
    () => ({ session, ready, signIn, completeNewPassword, signOut }),
    [session, ready, signIn, completeNewPassword, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Route guard
// ---------------------------------------------------------------------------

/**
 * Wraps a module so only the matching role can see it.
 *
 *   <RequireRole role="SUPERVISOR">
 *     <RfidModule />
 *   </RequireRole>
 *
 * - No session → redirect to "/" (login).
 * - Wrong role → redirect to that role's home (e.g., BAY_OPERATOR hitting
 *   /rfid gets sent to /sorter).
 * - Right role → render children.
 *
 * While the provider is hydrating (first paint after a refresh), we show a
 * minimal loading state to avoid flashing the login page for a logged-in user.
 */
export function RequireRole({ role, children }) {
  const { session, ready } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="text-ink-400 text-sm">Verificando sesión...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.user.role !== role) {
    const home = ROLE_HOMES[session.user.role] || '/';
    return <Navigate to={home} replace />;
  }

  return children;
}
