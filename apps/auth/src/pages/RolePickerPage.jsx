import { useNavigate } from 'react-router-dom';
import { mockSignIn, useAuth, ROLE_HOMES } from '@vertiche/design-system';
import { mockUsers } from '@vertiche/mock-data';

const ROLES = [
  {
    key: 'SUPERVISOR',
    label: 'Supervisor CEDIS',
    description: 'Vista completa del flujo. Trazabilidad RFID. Pedidos y palets.',
    module: 'RFID',
    accent: '#1E40AF',
  },
  {
    key: 'BAY_OPERATOR',
    label: 'Operador de Bahía',
    description: 'Pantalla de estación de empaque. Sorter y bahías.',
    module: 'Sorter & Bahía',
    accent: '#7C3AED',
  },
  {
    key: 'OPS_MANAGER',
    label: 'Gerente de Operaciones',
    description: 'KPIs en tiempo real. Análisis de productividad y métricas.',
    module: 'Dashboard',
    accent: '#0F766E',
  },
  {
    key: 'QA_INSPECTOR',
    label: 'Inspector de Calidad',
    description: 'Calificación de proveedores. Inspecciones QA y anomalías.',
    module: 'Proveedores',
    accent: '#C2410C',
  },
];

export function RolePickerPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  function handleSelect(roleKey) {
    const user = mockUsers[roleKey];
    if (!user) return;
    // Install the session in React state + sessionStorage, then navigate to
    // the role's module. No page reload, no URL fragment.
    signIn(mockSignIn(user));
    navigate(ROLE_HOMES[roleKey]);
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-900 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-md bg-ink-700 dark:bg-ink-700 flex items-center justify-center font-display font-bold text-white">
              V
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-ink-700 dark:text-ink-50 leading-none">
                Vertiche
              </div>
              <div className="text-[10px] text-ink-400 dark:text-ink-400 font-display font-medium uppercase tracking-industrial mt-1">
                SortFlow
              </div>
            </div>
          </div>

          <div className="label-industrial text-ink-400 dark:text-ink-400 mb-2">
            Modo demostración
          </div>
          <h1 className="font-display font-bold text-3xl text-ink-700 dark:text-ink-50 mb-2">
            ¿Cuál es tu rol hoy?
          </h1>
          <p className="text-sm text-ink-400 dark:text-ink-300 max-w-md mx-auto">
            En producción, AWS Cognito determinaría tu rol automáticamente. Para
            la demo, elige el módulo que quieres ver.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROLES.map((role) => (
            <button
              key={role.key}
              onClick={() => handleSelect(role.key)}
              className="group relative bg-white dark:bg-ink-800 rounded-card shadow-card border border-ink-100 dark:border-ink-700 p-6 text-left hover:shadow-card-hover transition-all hover:-translate-y-0.5"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-card"
                style={{ background: role.accent }}
              />
              <div className="flex items-start justify-between mb-4">
                <div
                  className="px-2 py-1 rounded text-[10px] font-display font-semibold uppercase tracking-industrial text-white"
                  style={{ background: role.accent }}
                >
                  {role.module}
                </div>
                <span className="text-ink-300 dark:text-ink-400 group-hover:text-ink-700 dark:group-hover:text-ink-100 transition-colors font-mono text-sm">
                  →
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-ink-700 dark:text-ink-50 mb-1">
                {role.label}
              </h3>
              <p className="text-sm text-ink-400 dark:text-ink-300 leading-relaxed">
                {role.description}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-ink-400">
          Esta demo instala una sesión mock en el navegador y navega al módulo
          correspondiente. En producción, AWS Cognito gestionaría el token real.
        </div>
      </div>
    </div>
  );
}
