/**
 * Vertiche SortFlow — Dashboard Industrial Limpio
 * Shared Tailwind preset. Every app in the monorepo extends this.
 *
 * Design principles:
 * - Legibility from a distance (CEDIS director views the screen from across the room)
 * - Status semantics: green = normal flow, amber = attention, red = real anomaly only
 * - Large bold numbers for KPIs (24px+ for primary metrics)
 * - High contrast even under variable warehouse lighting
 * - Restrained, functional, industrial — never decorative
 */

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        // Surface — light, neutral, industrial
        ink: {
          50: '#F5F7FA',   // page background
          100: '#E5EAF0',  // card border, subtle dividers
          200: '#CBD3DD',  // disabled text
          300: '#9AA5B5',  // secondary text
          400: '#5C6878',  // tertiary headings
          500: '#3A4452',  // body text
          600: '#252D38',  // strong headings
          700: '#161B23',  // primary text
          800: '#1A212C',  // elevated surface dark
          900: '#0A0D13',  // contrast accent
        },
        // Status semantics — the heart of the design system
        flow: {
          DEFAULT: '#15803D',   // green-700: normal flow
          bg: '#DCFCE7',        // green-100: subtle bg
          ring: '#22C55E',      // green-500: status dot
        },
        attention: {
          DEFAULT: '#A16207',   // amber-700: needs attention
          bg: '#FEF3C7',        // amber-100
          ring: '#F59E0B',      // amber-500
        },
        anomaly: {
          DEFAULT: '#B91C1C',   // red-700: real problem only
          bg: '#FEE2E2',        // red-100
          ring: '#EF4444',      // red-500
        },
        // Module accents — each module has its own brand tone
        // used sparingly, never overwhelming
        rfid: '#1E40AF',         // blue-800
        sorter: '#7C3AED',       // violet-600
        dashboard: '#0F766E',    // teal-700
        proveedores: '#C2410C',  // orange-700
      },
      fontFamily: {
        // Distinctive display: JetBrains Mono for numbers/IDs — industrial, technical feel
        // Body: Inter only for legibility (used minimally elsewhere — display sets the tone)
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Industrial scale — bigger than typical SaaS
        'kpi-xl': ['56px', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'kpi-lg': ['40px', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'kpi-md': ['28px', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.01em' }],
        'kpi-sm': ['22px', { lineHeight: '1.2', fontWeight: '600' }],
      },
      boxShadow: {
        'card': '0 1px 2px rgba(10, 13, 19, 0.04), 0 1px 3px rgba(10, 13, 19, 0.06)',
        'card-hover': '0 4px 8px rgba(10, 13, 19, 0.06), 0 2px 4px rgba(10, 13, 19, 0.08)',
        'inset-card': 'inset 0 0 0 1px rgba(10, 13, 19, 0.06)',
      },
      borderRadius: {
        'card': '6px',
        'pill': '999px',
      },
      letterSpacing: {
        'industrial': '0.08em', // for uppercase labels
      },
    },
  },
};
