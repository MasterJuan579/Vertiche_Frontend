/**
 * Vertiche SortFlow — Cognito client (raw fetch)
 *
 * Talks to the Cognito Identity Provider REST API directly with `fetch`. We do
 * NOT use aws-amplify or any AWS SDK — the user pool has USER_PASSWORD_AUTH
 * enabled, so we can skip SRP and send the password in the InitiateAuth call.
 *
 * Every export returns a normalized result object so callers never have to know
 * the raw AWS response shape:
 *   - { status: 'success', tokens: { idToken, accessToken, refreshToken } }
 *   - { status: 'challenge', challengeName, session }
 *   - { status: 'error', code, message }
 *
 * Env (read from import.meta.env, injected by Vite at build time):
 *   - VITE_COGNITO_REGION     (default 'us-east-1')
 *   - VITE_COGNITO_CLIENT_ID  (app client id — required)
 *   - VITE_COGNITO_USER_POOL_ID (kept for reference / future JWKS use)
 */

const REGION = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
// User pool id isn't part of the IDP endpoint (that's region-only), but we read
// it so a missing-config check can flag it and future token verification can use it.
const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;

// The Cognito IDP endpoint is region-scoped. All actions POST to the same URL
// and are routed by the X-Amz-Target header.
const ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;

const TARGET_PREFIX = 'AWSCognitoIdentityProviderService';

// ---------------------------------------------------------------------------
// Low-level transport
// ---------------------------------------------------------------------------

/**
 * POST a single Cognito action. Returns { ok, status, body } where body is the
 * parsed JSON (or {} if the response had no body). Never throws on HTTP errors
 * — callers inspect `ok` and translate the AWS error type themselves.
 */
async function postToCognito(action, payload) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `${TARGET_PREFIX}.${action}`,
    },
    body: JSON.stringify(payload),
  });

  let body = {};
  try {
    body = await res.json();
  } catch {
    // Some actions (e.g. GlobalSignOut) return an empty body on success.
  }

  return { ok: res.ok, status: res.status, body };
}

/**
 * Cognito reports errors as { __type: 'SomeException', message: '...' } with a
 * 4xx status. Normalize to our error shape. The code is the bare exception name
 * (the __type may be prefixed with a namespace like 'com.amazon...#').
 */
function toError(body) {
  const rawType = body && body.__type ? String(body.__type) : 'UnknownError';
  const code = rawType.includes('#') ? rawType.split('#').pop() : rawType;
  const message =
    (body && (body.message || body.Message)) || 'Cognito request failed.';
  return { status: 'error', code, message };
}

/**
 * Both InitiateAuth and RespondToAuthChallenge can return either tokens or a
 * follow-up challenge. This maps a successful HTTP response to our shape.
 */
function fromAuthResponse(body) {
  if (body.AuthenticationResult) {
    const r = body.AuthenticationResult;
    return {
      status: 'success',
      tokens: {
        idToken: r.IdToken,
        accessToken: r.AccessToken,
        refreshToken: r.RefreshToken,
      },
    };
  }
  if (body.ChallengeName) {
    return {
      status: 'challenge',
      challengeName: body.ChallengeName,
      session: body.Session,
    };
  }
  // Shouldn't happen, but fail closed rather than returning an empty success.
  return {
    status: 'error',
    code: 'UnexpectedResponse',
    message: 'Cognito returned no tokens and no challenge.',
  };
}

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

/**
 * Sign in with email + password (USER_PASSWORD_AUTH flow).
 * Returns success | challenge (NEW_PASSWORD_REQUIRED) | error.
 */
export async function initiateAuth(email, password) {
  if (!CLIENT_ID) {
    return {
      status: 'error',
      code: 'MissingConfig',
      message: 'VITE_COGNITO_CLIENT_ID is not set.',
    };
  }
  try {
    const { ok, body } = await postToCognito('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    });
    return ok ? fromAuthResponse(body) : toError(body);
  } catch {
    return {
      status: 'error',
      code: 'NetworkError',
      message: 'Could not reach the authentication service.',
    };
  }
}

/**
 * Answer the NEW_PASSWORD_REQUIRED challenge for first-login users. On success
 * returns tokens in the same shape as initiateAuth.
 */
export async function respondToNewPasswordChallenge(email, newPassword, session) {
  if (!CLIENT_ID) {
    return {
      status: 'error',
      code: 'MissingConfig',
      message: 'VITE_COGNITO_CLIENT_ID is not set.',
    };
  }
  try {
    const { ok, body } = await postToCognito('RespondToAuthChallenge', {
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      ClientId: CLIENT_ID,
      Session: session,
      ChallengeResponses: { USERNAME: email, NEW_PASSWORD: newPassword },
    });
    return ok ? fromAuthResponse(body) : toError(body);
  } catch {
    return {
      status: 'error',
      code: 'NetworkError',
      message: 'Could not reach the authentication service.',
    };
  }
}

/**
 * Revoke all of a user's tokens server-side. Best-effort: callers should clear
 * the local session regardless of the outcome, so this never throws.
 */
export async function globalSignOut(accessToken) {
  if (!accessToken) return;
  try {
    await postToCognito('GlobalSignOut', { AccessToken: accessToken });
  } catch {
    // Best-effort — local sign-out happens regardless.
  }
}

/**
 * Exchange a refresh token for a fresh id/access token (REFRESH_TOKEN_AUTH).
 * Cognito does not return a new refresh token here. Reserved for a future
 * silent-refresh flow; not wired into the UI yet.
 * Returns { status: 'success', tokens: { idToken, accessToken } } | error.
 */
export async function refreshTokens(refreshToken) {
  if (!CLIENT_ID) {
    return {
      status: 'error',
      code: 'MissingConfig',
      message: 'VITE_COGNITO_CLIENT_ID is not set.',
    };
  }
  try {
    const { ok, body } = await postToCognito('InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    });
    if (!ok) return toError(body);
    const r = body.AuthenticationResult || {};
    return {
      status: 'success',
      tokens: { idToken: r.IdToken, accessToken: r.AccessToken },
    };
  } catch {
    return {
      status: 'error',
      code: 'NetworkError',
      message: 'Could not reach the authentication service.',
    };
  }
}

// Exported only so a config check / debugging can confirm what was loaded.
export const cognitoConfig = { region: REGION, clientId: CLIENT_ID, userPoolId: USER_POOL_ID };
