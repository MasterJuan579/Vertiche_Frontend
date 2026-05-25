import { useTheme } from '../theme.jsx';

/**
 * A small sun/moon button that flips between dark and light.
 * Drop it anywhere — currently lives in AppShell's top-right corner.
 */
export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border ' +
        'border-ink-200 bg-white text-ink-600 transition-colors ' +
        'hover:bg-ink-50 hover:text-ink-900 ' +
        'dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 ' +
        'dark:hover:bg-ink-700 dark:hover:text-white ' +
        className
      }
    >
      {isDark ? (
        // Sun icon — shown in dark mode, clicking goes to light
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon icon — shown in light mode, clicking goes to dark
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
