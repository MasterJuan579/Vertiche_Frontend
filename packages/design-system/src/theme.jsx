/**
 * Vertiche SortFlow — Theme context
 *
 * Manages dark/light mode for the whole app. The preference persists in
 * localStorage so a returning user sees the same theme.
 *
 * The implementation uses Tailwind's class-based dark mode strategy:
 *   - When theme === 'dark', we add 'dark' to <html>.
 *   - When theme === 'light', we remove it.
 *   - All Tailwind dark: variants then activate.
 *
 * Modules opt in by adding dark: variants to their classes. Modules that
 * don't add them will simply stay light — toggling the theme has no visible
 * effect on those parts of the UI. This is intentional: it lets teams adopt
 * dark mode at their own pace without blocking the rollout.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'vertiche.theme';

const ThemeContext = createContext(null);

function readInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage disabled — fall through.
  }
  // Fall back to OS preference on first visit.
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);

  // Apply the class to <html> whenever theme changes.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore — preference is in memory at least.
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (next !== 'dark' && next !== 'light') return;
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}
