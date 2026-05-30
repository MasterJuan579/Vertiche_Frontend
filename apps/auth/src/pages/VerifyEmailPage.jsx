import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, ThemeToggle, useAuth } from '@vertiche/design-system';

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

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, password, accessToken } = location.state || {};

  const { confirmEmailAndFinish, resendEmailVerificationCode } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [resent, setResent] = useState(false);

  // Reached directly without logging in → nothing to verify against.
  if (!email || !password || !accessToken) {
    return <Navigate to="/" replace />;
  }

  const codeValid = /^\d{6}$/.test(code);
  const canSubmit = codeValid && !loading;

  function errorFor(result) {
    switch (result.code) {
      case 'CodeMismatchException':
        return { message: 'Código incorrecto. Verifica e intenta de nuevo.', expired: false };
      case 'ExpiredCodeException':
        return { message: 'El código expiró. Solicita uno nuevo.', expired: true };
      case 'LimitExceededException':
        return { message: 'Demasiados intentos. Intenta más tarde.', expired: false };
      case 'not_registered':
        return { message: 'Tu cuenta no está registrada en el sistema. Contacta a un administrador.', expired: false };
      default:
        return { message: 'No se pudo verificar el correo. Intenta de nuevo.', expired: false };
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setExpired(false);
    setLoading(true);

    const result = await confirmEmailAndFinish(email, password, code, accessToken);

    if (result.status === 'success') {
      // establishSession installed the session; "/" bounces to the role home.
      navigate('/', { replace: true });
      return;
    }

    setLoading(false);
    const mapped = errorFor(result);
    setError(mapped.message);
    setExpired(mapped.expired);
  }

  async function handleResend() {
    setError('');
    setExpired(false);
    setResent(false);
    const r = await resendEmailVerificationCode(accessToken);
    if (r.status === 'success') {
      setResent(true);
    } else {
      setError(errorFor(r).message);
    }
  }

  function handleCodeChange(e) {
    setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
    if (error) setError('');
    if (expired) setExpired(false);
    if (resent) setResent(false);
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
            Verificación de correo
          </div>
          <h2 className="font-display font-bold text-2xl text-ink-700 dark:text-ink-100 mb-1">
            Verifica tu correo
          </h2>
          <p className="text-sm text-ink-400 dark:text-ink-300 mb-8">
            Te enviamos un código a {email}. Ingrésalo para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="label-industrial text-ink-400 dark:text-ink-300 mb-1.5 block"
              >
                Código de verificación
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={handleCodeChange}
                disabled={loading}
                placeholder="123456"
                className="w-full px-3 py-2.5 bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-500 rounded-card text-sm text-ink-700 dark:text-ink-100 placeholder-ink-300 dark:placeholder-ink-500 tracking-[0.3em] focus:outline-none focus:border-ink-400 dark:focus:border-ink-300 focus:ring-2 focus:ring-ink-100 dark:focus:ring-ink-700 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {resent && (
              <div className="p-3 bg-flow-bg/50 border border-flow/30 rounded-card text-sm text-flow">
                Código reenviado. Revisa tu correo.
              </div>
            )}

            {error && (
              <div className="p-3 bg-anomaly-bg border border-anomaly/20 rounded-card text-sm text-anomaly">
                {error}
                {expired && (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={handleResend}
                      className="font-display font-semibold underline hover:no-underline"
                    >
                      Solicitar nuevo código
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!canSubmit}
              >
                {loading ? (
                  <>
                    <Spinner />
                    Verificando...
                  </>
                ) : (
                  'Verificar y entrar'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-xs text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200 transition-colors disabled:opacity-60"
            >
              Reenviar código
            </button>
            <Link
              to="/"
              className="text-xs text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200 transition-colors"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
