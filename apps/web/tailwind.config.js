import preset from '@vertiche/design-system/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  // 'class' strategy: dark mode kicks in when <html class="dark"> is set.
  // The ThemeProvider in @vertiche/design-system toggles this class.
  darkMode: 'class',
  // CRITICAL: these globs must reach into every module so Tailwind generates
  // classes used anywhere in the app. Missing a glob = invisible UI breakage
  // in production (classes get tree-shaken because Tailwind doesn't see them).
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    '../auth/src/**/*.{js,jsx}',
    '../rfid/src/**/*.{js,jsx}',
    '../sorter/src/**/*.{js,jsx}',
    '../dashboard/src/**/*.{js,jsx}',
    '../proveedores/src/**/*.{js,jsx}',
    '../admin/src/**/*.{js,jsx}',
    '../../packages/design-system/src/**/*.{js,jsx}',
  ],
};
