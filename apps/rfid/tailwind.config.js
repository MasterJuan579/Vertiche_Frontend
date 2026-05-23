import preset from '@vertiche/design-system/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    '../../packages/design-system/src/**/*.{js,jsx}',
  ],
};
