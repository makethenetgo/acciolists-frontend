const SESSION_STORAGE_KEY = 'acciolists.auth.session';
const TRANSACTION_STORAGE_KEY = 'acciolists.auth.transaction';

function resolveFrontendOrigin(config) {
  if (config?.frontend_url) {
    return new URL(config.frontend_url).origin;
  }

  return window.location.origin;
}

function resolveRealmBaseUrl(config) {
  const issuerUrl = new URL(config.issuer_url);
  return `${resolveFrontendOrigin(config)}${issuerUrl.pathname}`;
}

function base64UrlEncode(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomString(length = 64) {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256(value) {
  const encoded = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', encoded);
  return base64UrlEncode(digest);
}

export function loadStoredSession() {
  const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function storeSession(session) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function readLoginTransaction() {
  const rawValue = window.sessionStorage.getItem(TRANSACTION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    window.sessionStorage.removeItem(TRANSACTION_STORAGE_KEY);
    return null;
  }
}

export function consumeLoginTransaction() {
  const transaction = readLoginTransaction();
  window.sessionStorage.removeItem(TRANSACTION_STORAGE_KEY);
  return transaction;
}

export async function createLoginUrl(config, redirectPath) {
  const state = randomString(32);
  const codeVerifier = randomString(96);
  const codeChallenge = await sha256(codeVerifier);
  const redirectUri = `${resolveFrontendOrigin(config)}/login/callback`;

  window.sessionStorage.setItem(
    TRANSACTION_STORAGE_KEY,
    JSON.stringify({
      state,
      codeVerifier,
      redirectPath,
      redirectUri,
    })
  );

  const params = new URLSearchParams({
    client_id: config.ui_client_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email offline_access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${resolveRealmBaseUrl(config)}/protocol/openid-connect/auth?${params.toString()}`;
}

async function postTokenRequest(endpoint, params) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.error_description ||
      payload?.error ||
      `Token request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function buildSession(tokenResponse) {
  const accessClaims = parseJwtPayload(tokenResponse.access_token);
  const refreshClaims = parseJwtPayload(tokenResponse.refresh_token);

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    idToken: tokenResponse.id_token || null,
    accessTokenExpiresAt: accessClaims?.exp || 0,
    refreshTokenExpiresAt: refreshClaims?.exp || 0,
    user: {
      subject: accessClaims?.sub || '',
      username: accessClaims?.preferred_username || accessClaims?.email || '',
      roles: Array.isArray(accessClaims?.realm_access?.roles)
        ? accessClaims.realm_access.roles.filter(role => typeof role === 'string').sort()
        : [],
    },
  };
}

export async function exchangeAuthorizationCode(config, code, transaction) {
  return postTokenRequest(`${resolveRealmBaseUrl(config)}/protocol/openid-connect/token`, {
    grant_type: 'authorization_code',
    client_id: config.ui_client_id,
    code,
    redirect_uri: transaction.redirectUri,
    code_verifier: transaction.codeVerifier,
  });
}

export async function refreshAccessToken(config, refreshToken) {
  return postTokenRequest(`${resolveRealmBaseUrl(config)}/protocol/openid-connect/token`, {
    grant_type: 'refresh_token',
    client_id: config.ui_client_id,
    refresh_token: refreshToken,
  });
}

export function buildLogoutUrl(config, session) {
  const postLogoutRedirectUri = `${window.location.origin}/`;
  const params = new URLSearchParams({
    client_id: config.ui_client_id,
    post_logout_redirect_uri: postLogoutRedirectUri,
  });

  if (session?.idToken) {
    params.set('id_token_hint', session.idToken);
  }

  return `${resolveRealmBaseUrl(config)}/protocol/openid-connect/logout?${params.toString()}`;
}

export function isExpired(epochSeconds, skewSeconds = 30) {
  if (!epochSeconds) {
    return true;
  }

  return Date.now() >= (epochSeconds - skewSeconds) * 1000;
}

export function parseJwtPayload(token) {
  if (!token) {
    return null;
  }

  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '='));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
