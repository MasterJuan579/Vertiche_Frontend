import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@vertiche/design-system';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    // In mock mode, any credentials work. Proceed to role picker.
    navigate('/select-role');
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
      <div className="flex-1 flex items-center justify-center p-8 bg-ink-50 dark:bg-ink-900">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8">
            <div className="w-10 h-10 rounded-md bg-ink-700 flex items-center justify-center font-display font-bold text-white">
              V
            </div>
          </div>

          <div className="label-industrial text-ink-400 dark:text-ink-400 mb-2">
            Inicio de sesión
          </div>
          <h2 className="font-display font-bold text-2xl text-ink-700 dark:text-ink-50 mb-1">
            Bienvenido de vuelta.
          </h2>
          <p className="text-sm text-ink-400 dark:text-ink-300 mb-8">
            Ingresa con tu cuenta corporativa de Vertiche.
          </p>

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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@vertiche.mx"
                className="w-full px-3 py-2.5 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-card text-sm text-ink-700 dark:text-ink-50 placeholder-ink-300 dark:placeholder-ink-400 focus:outline-none focus:border-ink-400 dark:focus:border-ink-600 focus:ring-2 focus:ring-ink-100 dark:focus:ring-ink-700"
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-card text-sm text-ink-700 dark:text-ink-50 placeholder-ink-300 dark:placeholder-ink-400 focus:outline-none focus:border-ink-400 dark:focus:border-ink-600 focus:ring-2 focus:ring-ink-100 dark:focus:ring-ink-700"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full">
                Continuar
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-attention-bg/60 border border-attention/20 rounded-card text-xs text-attention">
            <div className="font-display font-semibold uppercase tracking-industrial mb-1">
              Modo demostración
            </div>
            <div className="leading-relaxed text-ink-500">
              Esta build mockea la autenticación con AWS Cognito. Cualquier
              correo y contraseña te llevará al selector de rol.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
