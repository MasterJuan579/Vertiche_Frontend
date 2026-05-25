import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle.jsx';

export function AppShell({
  moduleName,
  moduleAccent,
  navItems = [],
  user,
  onLogout,
  children,
}) {
  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-ink-100 flex flex-col flex-shrink-0">
        {/* Brand block */}
        <div className="px-5 py-5 border-b border-ink-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center font-display font-bold text-white text-sm"
              style={{ background: moduleAccent }}
            >
              V
            </div>
            <div>
              <div className="font-display font-bold text-ink-700 text-sm leading-none">
                Vertiche
              </div>
              <div className="text-[10px] text-ink-400 font-display font-medium uppercase tracking-industrial mt-1">
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
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-card text-sm font-medium mb-0.5 transition-colors ${
                  isActive
                    ? 'bg-ink-50 text-ink-700'
                    : 'text-ink-400 hover:text-ink-700 hover:bg-ink-50'
                }`
              }
            >
              <span className="w-1 h-1 rounded-full bg-current" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User block */}
        {user && (
          <div className="border-t border-ink-100 px-4 py-3 dark:border-ink-700">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-display font-semibold text-ink-700 truncate dark:text-ink-100">
                  {user.name}
                </div>
                <div className="text-[10px] text-ink-400 uppercase tracking-industrial font-display font-medium mt-0.5">
                  {user.role}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ThemeToggle />
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="text-[10px] text-ink-400 hover:text-anomaly font-display font-semibold uppercase tracking-industrial"
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
