import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './components/ui';
import { getErrorMessage, api, setAccessTokenResolver } from './lib/api';
import {
  buildLogoutUrl,
  buildSession,
  clearStoredSession,
  consumeLoginTransaction,
  createLoginUrl,
  exchangeAuthorizationCode,
  isExpired,
  loadStoredSession,
  refreshAccessToken,
  storeSession,
} from './lib/auth';

const AuthContext = createContext(null);

function AuthScreen({ error, loading, onLogin }) {
  return (
    <div className="control-plane">
      <div className="control-plane__glow control-plane__glow--left" aria-hidden="true" />
      <div className="control-plane__glow control-plane__glow--right" aria-hidden="true" />

      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Identity</p>
          <h1>Sign in to AccioLists</h1>
          <p className="auth-card__copy">
            Local access is now brokered through Keycloak. Sign in before using the
            rune, scroll, and user-management screens.
          </p>
          {error ? <p className="auth-card__error">{error}</p> : null}
          <div className="auth-card__actions">
            <Button loading={loading} onClick={onLogin} variant="primary">
              Sign in
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function LoadingScreen({ message }) {
  return (
    <div className="control-plane">
      <div className="control-plane__glow control-plane__glow--left" aria-hidden="true" />
      <div className="control-plane__glow control-plane__glow--right" aria-hidden="true" />

      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Identity</p>
          <h1>Preparing secure access</h1>
          <p className="auth-card__copy">{message}</p>
        </section>
      </main>
    </div>
  );
}

export function AuthProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [authConfig, setAuthConfig] = useState(null);
  const [authSession, setAuthSession] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const refreshPromiseRef = useRef(null);
  const authConfigRef = useRef(null);
  const authSessionRef = useRef(null);

  useEffect(() => {
    authConfigRef.current = authConfig;
  }, [authConfig]);

  useEffect(() => {
    authSessionRef.current = authSession;
  }, [authSession]);

  const applySession = nextSession => {
    authSessionRef.current = nextSession;
    setAuthSession(nextSession);

    if (nextSession) {
      storeSession(nextSession);
    } else {
      clearStoredSession();
    }
  };

  const ensureFreshSession = async () => {
    const currentConfig = authConfigRef.current;
    const currentSession = authSessionRef.current;

    if (!currentConfig?.enabled || !currentSession) {
      return currentSession;
    }

    if (!isExpired(currentSession.accessTokenExpiresAt)) {
      return currentSession;
    }

    if (!currentSession.refreshToken || isExpired(currentSession.refreshTokenExpiresAt, 10)) {
      applySession(null);
      return null;
    }

    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refreshAccessToken(currentConfig, currentSession.refreshToken)
        .then(tokenResponse => {
          const nextSession = buildSession(tokenResponse);
          applySession(nextSession);
          return nextSession;
        })
        .catch(errorValue => {
          applySession(null);
          throw errorValue;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  };

  useEffect(() => {
    setAccessTokenResolver(async () => {
      const nextSession = await ensureFreshSession();
      return nextSession?.accessToken || null;
    });

    return () => {
      setAccessTokenResolver(null);
    };
  }, [authConfig, authSession]);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthConfig() {
      setStatus('loading');
      setError('');

      try {
        const response = await api.get('/api/auth/public-config');
        if (cancelled) {
          return;
        }

        const nextConfig = response.data;
        setAuthConfig(nextConfig);
        authConfigRef.current = nextConfig;

        if (nextConfig?.enabled && nextConfig?.frontend_url) {
          const configuredOrigin = new URL(nextConfig.frontend_url).origin;
          if (configuredOrigin !== window.location.origin) {
            const redirectUrl = new URL(
              `${location.pathname}${location.search}${location.hash}`,
              nextConfig.frontend_url
            );
            window.location.replace(redirectUrl.toString());
            return;
          }
        }

        if (!nextConfig?.enabled) {
          setStatus('authenticated');
          return;
        }

        const storedSession = loadStoredSession();
        if (storedSession) {
          applySession(storedSession);

          try {
            const nextSession = await ensureFreshSession();
            if (cancelled) {
              return;
            }

            if (nextSession) {
              setStatus('authenticated');
              return;
            }
          } catch (sessionError) {
            if (!cancelled) {
              setError(getErrorMessage(sessionError, 'Unable to refresh your sign-in session.'));
            }
          }
        }

        setStatus('unauthenticated');
      } catch (configError) {
        if (!cancelled) {
          setStatus('error');
          setError(getErrorMessage(configError, 'Unable to load authentication settings.'));
        }
      }
    }

    loadAuthConfig();

    return () => {
      cancelled = true;
    };
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      if (!authConfig?.enabled || location.pathname !== '/login/callback') {
        return;
      }

      setStatus('loading');
      setError('');

      try {
        const params = new URLSearchParams(location.search);
        const errorCode = params.get('error');
        const errorDescription = params.get('error_description');
        if (errorCode) {
          throw new Error(errorDescription || errorCode);
        }

        const code = params.get('code');
        const state = params.get('state');
        const transaction = consumeLoginTransaction();

        if (!code || !state || !transaction || transaction.state !== state) {
          throw new Error('The login response did not match the current browser session.');
        }

        const tokenResponse = await exchangeAuthorizationCode(authConfig, code, transaction);
        if (cancelled) {
          return;
        }

        const nextSession = buildSession(tokenResponse);
        applySession(nextSession);
        setStatus('authenticated');
        navigate(transaction.redirectPath || '/', { replace: true });
      } catch (callbackError) {
        if (!cancelled) {
          applySession(null);
          setStatus('unauthenticated');
          setError(getErrorMessage(callbackError, 'Sign-in could not be completed.'));
          navigate('/', { replace: true });
        }
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [authConfig, location.pathname, location.search, navigate]);

  const login = async () => {
    if (!authConfig?.enabled) {
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const redirectPath = `${location.pathname}${location.search}${location.hash}` || '/';
      const loginUrl = await createLoginUrl(authConfig, redirectPath);
      window.location.assign(loginUrl);
    } catch (loginError) {
      setStatus('unauthenticated');
      setError(getErrorMessage(loginError, 'Unable to start the sign-in flow.'));
    }
  };

  const logout = () => {
    const currentConfig = authConfigRef.current;
    const currentSession = authSessionRef.current;
    applySession(null);
    setStatus(currentConfig?.enabled ? 'unauthenticated' : 'authenticated');

    if (!currentConfig?.enabled) {
      navigate('/', { replace: true });
      return;
    }

    window.location.assign(buildLogoutUrl(currentConfig, currentSession));
  };

  const value = {
    authConfig,
    authSession,
    isAuthenticated: status === 'authenticated',
    isAdmin: Boolean(authSession?.user?.roles?.includes('acciolists_admin')),
    login,
    logout,
    status,
    user: authSession?.user || null,
  };

  if (status === 'loading') {
    return <LoadingScreen message="Checking Keycloak session state." />;
  }

  if (status !== 'authenticated') {
    return <AuthScreen error={error} loading={status === 'loading'} onLogin={login} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
