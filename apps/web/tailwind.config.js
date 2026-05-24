import preset from '@vertiche/design-system/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
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
    '../../packages/design-system/src/**/*.{js,jsx}',
  ],
};
