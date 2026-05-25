/**
 * Vertiche SortFlow — Auth context
 *
 * Replaces the old URL-fragment hand-off (window.location.href = "...#token=...")
 * with a standard React context. Now that all modules live in a single shell,
 * the session lives in React state and is shared across modules without page
 * reloads.
 *
 * In production, replace mockSignIn with a real AWS Cognito SDK call. The shape
 * of the session ({ token, user: { sub, email, name, role } }) is intentionally
 * the same as what Cognito returns, so only this file changes.
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

const STORAGE_KEY = 'vertiche.auth';

// Where each role lives in the shell. Used by RequireRole to redirect a user
// who hits the wrong module to their correct one.
export const ROLE_HOMES = {
  SUPERVISOR: '/rfid',
  BAY_OPERATOR: '/sorter',
  OPS_MANAGER: '/dashboard',
  QA_INSPECTOR: '/proveedores',
};

// ---------------------------------------------------------------------------
// Mock token utilities — replace with real Cognito SDK calls in production.
// ---------------------------------------------------------------------------

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
  const signature = btoa(`mock-signature-${user.sub}`);
  return `${header}.${payload}.${signature}`;
}

/**
 * Called by the login/role-picker pages. Builds a fake JWT for the chosen user
 * and returns it together with the user. The caller then passes both to
 * signIn() from useAuth() to install the session.
 */
export function mockSignIn(user) {
  const token = buildMockToken(user);
  return { token, user };
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

  const signIn = useCallback((nextSession) => {
    setSession(nextSession);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    } catch {
      // sessionStorage full or disabled — session still works in memory.
    }
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }, []);

  // useMemo prevents the context value from changing on every render, which
  // would force every consumer to re-render.
  const value = useMemo(
    () => ({ session, ready, signIn, signOut }),
    [session, ready, signIn, signOut]
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
