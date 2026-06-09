import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, ThemeToggle, useAuth, ROLE_HOMES } from '@vertiche/design-system';

// Maps a signIn() failure code to a user-facing Spanish message.
function errorMessage(code) {
  switch (code) {
    case 'NotAuthorizedException':
      return 'Email o contraseña incorrectos.';
    case 'not_registered':
      return 'Tu cuenta no está registrada en el sistema. Contacta a un administrador.';
    case 'UserNotConfirmedException':
      return 'Tu cuenta no está verificada. Contacta a un administrador.';
    default:
      return 'No se pudo iniciar sesión. Intenta de nuevo.';
  }
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Post-recovery success toast — set by ConfirmForgotPasswordPage on reset.
  const [showRecoveryToast, setShowRecoveryToast] = useState(
    !!location.state?.recoverySuccess
  );
  useEffect(() => {
    if (!showRecoveryToast) return;
    const t = setTimeout(() => setShowRecoveryToast(false), 5000);
    return () => clearTimeout(t);
  }, [showRecoveryToast]);

  // Once a session exists (fresh login or already-authenticated visit to "/"),
  // bounce to the role's module home. Doing this in an effect — rather than
  // reading session right after await signIn() — avoids a stale-closure read,
  // since the context state hasn't re-rendered yet at that point.
  useEffect(() => {
    if (session) {
      navigate(ROLE_HOMES[session.user.role] || '/', { replace: true });
    }
  }, [session, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.status === 'success') {
        // Keep the spinner up; the effect above navigates once session lands.
        return;
      }
      if (result.status === 'verify_email') {
        // Email not verified — carry email + password (for re-auth) + access token
        // to the verify page. No session is stored, so the user isn't logged in.
        navigate('/verificar-email', {
          state: { email, password, accessToken: result.tokens.accessToken },
        });
        return;
      }
      if (
        result.status === 'challenge' &&
        result.challengeName === 'NEW_PASSWORD_REQUIRED'
      ) {
        navigate('/nueva-contrasena', {
          state: { email: result.email, session: result.session },
        });
        return;
      }

      setLoading(false);
      setError(errorMessage(result.code));
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      setError('Ocurrió un error inesperado al iniciar sesión. Intenta de nuevo.');
    }
  }

  // Clear the error as soon as the user edits either field.
  function handleEmailChange(e) {
    setEmail(e.target.value);
    if (error) setError('');
  }
  function handlePasswordChange(e) {
    setPassword(e.target.value);
    if (error) setError('');
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-900 flex">
      {/* Left panel: branding */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-ink-700 text-white p-12 relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative flex flex-col w-full">
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-11 h-11 rounded-md bg-white flex items-center justify-center font-display font-bold text-ink-700 text-lg">
              V
            </div>
            <div>
              <div className="font-display font-bold text-lg leading-none">
                Vertiche
              </div>
              <div className="text-[11px] font-display font-medium uppercase tracking-industrial mt-1 text-ink-300">
                SortFlow
              </div>
            </div>
          </div>

          <div className="my-auto">
            <div className="text-[11px] font-display font-semibold uppercase tracking-industrial text-ink-300 mb-4">
              Centro de Distribución · v1.0
            </div>
            <h1 className="font-display font-bold text-4xl lg:text-5xl leading-tight tracking-tight max-w-md">
              Trazabilidad RFID en tiempo real para la operación CEDIS.
            </h1>
            <p className="mt-5 text-ink-300 max-w-md leading-relaxed">
              Cuatro módulos especializados para cuatro roles operativos. Un solo
              sistema. Una sola fuente de verdad.
            </p>
          </div>

          <div className="text-xs text-ink-300 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="status-dot bg-flow-ring pulse-flow" />
              <span className="label-industrial">Sistema operativo</span>
            </div>
            <span className="text-ink-400">·</span>
            <span className="font-mono">{new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Right panel: form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8">
            <div className="w-10 h-10 rounded-md bg-ink-700 flex items-center justify-center font-display font-bold text-white">
              V
            </div>
          </div>

          <div className="label-industrial text-ink-400 dark:text-ink-300 mb-2">
            Inicio de sesión
          </div>
          <h2 className="font-display font-bold text-2xl text-ink-700 dark:text-ink-100 mb-1">
            Bienvenido de vuelta.
          </h2>
          <p className="text-sm text-ink-400 dark:text-ink-300 mb-8">
            Ingresa con tu cuenta corporativa de Vertiche.
          </p>

          {showRecoveryToast && (
            <div className="mb-6 rounded-card border border-flow/30 bg-flow-bg/50 px-3 py-2 text-sm text-flow">
              Contraseña actualizada. Inicia sesión con tu nueva contraseña.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="label-industrial text-ink-400 dark:text-ink-300 mb-1.5 block"
              >
                Correo
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                autoComplete="username"
                placeholder="nombre@vertiche.mx"
                className="w-full px-3 py-2.5 bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-500 rounded-card text-sm text-ink-700 dark:text-ink-100 placeholder-ink-300 dark:placeholder-ink-500 focus:outline-none focus:border-ink-400 dark:focus:border-ink-300 focus:ring-2 focus:ring-ink-100 dark:focus:ring-ink-700 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="label-industrial text-ink-400 dark:text-ink-300 mb-1.5 block"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-500 rounded-card text-sm text-ink-700 dark:text-ink-100 placeholder-ink-300 dark:placeholder-ink-500 focus:outline-none focus:border-ink-400 dark:focus:border-ink-300 focus:ring-2 focus:ring-ink-100 dark:focus:ring-ink-700 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex justify-end">
              <Link
                to="/recuperar-contrasena"
                className="text-xs text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <div className="p-3 bg-anomaly-bg border border-anomaly/20 rounded-card text-sm text-anomaly">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner />
                    Iniciando sesión...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
