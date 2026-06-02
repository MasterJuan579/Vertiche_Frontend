import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle.jsx';
import { useAuth } from '../auth.jsx';

// All modules, for the ADMIN switcher. Accents mirror each module's own ACCENT.
const ALL_MODULES = [
  { to: '/rfid', label: 'Supervisión RFID', accent: '#1E40AF' },
  { to: '/sorter', label: 'Sorter & Bahía', accent: '#7C3AED' },
  { to: '/dashboard', label: 'Dashboard', accent: '#0F766E' },
  { to: '/proveedores', label: 'Calidad Proveedores', accent: '#C2410C' },
  { to: '/admin', label: 'Admin', accent: '#475569' },
];

export function AppShell({
  moduleName,
  moduleAccent,
  navItems = [],
  user,
  onLogout,
  children,
}) {
  // The real session role, used to gate the admin-only module switcher. Note
  // this differs from `user.role`, which is the hardcoded display label.
  const { session } = useAuth();
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-900 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white dark:bg-ink-700 border-r border-ink-100 dark:border-ink-600 flex flex-col flex-shrink-0">
        {/* Brand block */}
        <div className="px-5 py-5 border-b border-ink-100 dark:border-ink-600">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center font-display font-bold text-white text-sm"
              style={{ background: moduleAccent }}
            >
              V
            </div>
            <div>
              <div className="font-display font-bold text-ink-700 dark:text-ink-100 text-sm leading-none">
                Vertiche
              </div>
              <div className="text-[10px] text-ink-400 dark:text-ink-300 font-display font-medium uppercase tracking-industrial mt-1">
                SortFlow
              </div>
            </div>
          </div>
          <div
            className="mt-4 inline-flex items-center px-2 py-1 rounded-md text-[10px] font-display font-semibold uppercase tracking-industrial text-white"
            style={{ background: moduleAccent }}
          >
            {moduleName}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4">
          {navItems.map((item) => (
            item.type === 'select' ? (
              <label key={item.key || item.label} className="block px-3 py-2 mb-2">
                <span className="block mb-1.5 text-[10px] font-display font-semibold uppercase tracking-industrial text-ink-400 dark:text-ink-300">
                  {item.label}
                </span>
                <select
                  value={item.value}
                  onChange={(event) => item.onChange?.(event.target.value)}
                  className="w-full h-9 rounded-card border border-ink-100 bg-white px-2.5 font-mono text-xs font-bold text-ink-700 outline-none transition-colors focus:border-rfid dark:border-ink-600 dark:bg-ink-700 dark:text-ink-100"
                >
                  {(item.options || []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-card text-sm font-medium mb-0.5 transition-colors ${
                    isActive
                      ? 'bg-ink-50 dark:bg-ink-600 text-ink-700 dark:text-ink-100'
                      : 'text-ink-400 dark:text-ink-300 hover:text-ink-700 dark:hover:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-600'
                  }`
                }
              >
                <span className="w-1 h-1 rounded-full bg-current" />
                {item.label}
              </NavLink>
            )
          ))}
        </nav>

        {/* Admin-only module switcher (A1) — sits between the per-module nav
            and the user block. Non-admins never see it. */}
        {isAdmin && (
          <div className="px-2 pb-4 border-t border-ink-100 dark:border-ink-600 pt-3">
            <div className="px-3 mb-1 text-[10px] text-ink-400 dark:text-ink-300 uppercase tracking-industrial font-display font-semibold">
              Cambiar módulo
            </div>
            {ALL_MODULES.map((mod) => (
              <NavLink
                key={mod.to}
                to={mod.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-card text-sm font-medium mb-0.5 transition-colors ${
                    isActive
                      ? 'bg-ink-50 dark:bg-ink-600 text-ink-700 dark:text-ink-100'
                      : 'text-ink-400 dark:text-ink-300 hover:text-ink-700 dark:hover:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-600'
                  }`
                }
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: mod.accent }} />
                {mod.label}
              </NavLink>
            ))}
          </div>
        )}

        {/* User block */}
        {user && (
          <div className="border-t border-ink-100 px-4 py-3 dark:border-ink-700">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-display font-semibold text-ink-700 truncate dark:text-ink-100">
                  {user.name}
                </div>
                <div className="text-[10px] text-ink-400 dark:text-ink-300 uppercase tracking-industrial font-display font-medium mt-0.5">
                  {isAdmin ? 'Administrador · viendo módulo' : user.role}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ThemeToggle />
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="text-[10px] text-ink-400 dark:text-ink-300 hover:text-anomaly font-display font-semibold uppercase tracking-industrial"
                  >
                    Salir
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
