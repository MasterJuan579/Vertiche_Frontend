import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, useAuth, ROLE_HOMES } from '@vertiche/design-system';

// Cognito's default password policy. Each rule is shown live as the user types.
const RULES = [
  { key: 'len', label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'Una letra mayúscula', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'Una letra minúscula', test: (p) => /[a-z]/.test(p) },
  { key: 'num', label: 'Un número', test: (p) => /[0-9]/.test(p) },
  { key: 'sym', label: 'Un símbolo', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

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

function Rule({ met, label }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className={`inline-flex items-center justify-center w-4 h-4 ${
          met ? 'text-flow' : 'text-ink-300'
        }`}
        aria-hidden="true"
      >
        {met ? '✓' : '○'}
      </span>
      <span className={met ? 'text-ink-600' : 'text-ink-400'}>{label}</span>
    </li>
  );
}

export function NewPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // `session` here is the Cognito challenge Session string, NOT our app session.
  const { email, session: cognitoSession } = location.state || {};

  const { session: appSession, completeNewPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // After the password is set, completeNewPassword installs the app session;
  // navigate to the role home once it lands (same pattern as LoginPage).
  useEffect(() => {
    if (appSession) {
      navigate(ROLE_HOMES[appSession.user.role] || '/', { replace: true });
    }
  }, [appSession, navigate]);

  // Reached directly without going through LoginPage's challenge → no session
  // to answer. Send them back to login.
  if (!email || !cognitoSession) {
    return <Navigate to="/" replace />;
  }

  const rulesPassed = RULES.map((r) => r.test(password));
  const allRulesPass = rulesPassed.every(Boolean);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const canSubmit = allRulesPass && passwordsMatch && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setLoading(true);

    const result = await completeNewPassword(email, password, cognitoSession);

    if (result.status === 'success') {
      // Keep the spinner up; the effect navigates once the session lands.
      return;
    }

    setLoading(false);
    setError('No se pudo cambiar la contraseña. Vuelve a intentar.');
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
    if (error) setError('');
  }
  function handleConfirmChange(e) {
    setConfirm(e.target.value);
    if (error) setError('');
  }

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Left panel: branding — same as LoginPage */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-ink-700 text-white p-12 relative overflow-hidden">
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

      {/* Right panel: new-password form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8">
            <div className="w-10 h-10 rounded-md bg-ink-700 flex items-center justify-center font-display font-bold text-white">
              V
            </div>
          </div>

          <div className="label-industrial text-ink-400 mb-2">
            Primer inicio de sesión
          </div>
          <h2 className="font-display font-bold text-2xl text-ink-700 mb-1">
            Crea tu contraseña
          </h2>
          <p className="text-sm text-ink-400 mb-8">
            Es tu primer inicio de sesión. Define una contraseña permanente.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="label-industrial text-ink-400 mb-1.5 block"
              >
                Nueva contraseña
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-white border border-ink-200 rounded-card text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-100 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="label-industrial text-ink-400 mb-1.5 block"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={handleConfirmChange}
                disabled={loading}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-white border border-ink-200 rounded-card text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-100 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Live validation checklist */}
            <ul className="space-y-1.5 pt-1">
              {RULES.map((rule, i) => (
                <Rule key={rule.key} met={rulesPassed[i]} label={rule.label} />
              ))}
              <Rule
                met={passwordsMatch}
                label="Las contraseñas coinciden"
              />
            </ul>

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
                disabled={!canSubmit}
              >
                {loading ? (
                  <>
                    <Spinner />
                    Guardando...
                  </>
                ) : (
                  'Guardar contraseña'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
