/**
 * Inline SVG icons for the sorter module. Stroke color and size are props.
 *
 * Why inline (not lucide-react or similar): the original code used these
 * specific shapes and the design has been signed off. Lower bundle impact
 * than a full icon library for just 8 icons.
 */

export const IconAntenna = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12a7 7 0 0 1 14 0" />
    <path d="M8 12a4 4 0 0 1 8 0" />
    <circle cx="12" cy="12" r="1.5" fill={color} />
    <line x1="12" y1="14" x2="12" y2="21" />
  </svg>
);

export const IconScan = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V5a1 1 0 0 1 1-1h2" />
    <path d="M17 4h2a1 1 0 0 1 1 1v2" />
    <path d="M20 17v2a1 1 0 0 1-1 1h-2" />
    <path d="M7 20H5a1 1 0 0 1-1-1v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="7" y1="9"  x2="17" y2="9" />
    <line x1="7" y1="15" x2="13" y2="15" />
  </svg>
);

export const IconBolt = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M13 2 3 14h7l-1 8 11-13h-7l1-7z" />
  </svg>
);

export const IconSigma = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h14l-7 8 7 8H5l5-8L5 4z" />
  </svg>
);

export const IconWarning = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 1 21h22L12 2z" />
    <line x1="12" y1="9"  x2="12" y2="14" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const IconArrow = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="13 5 19 12 13 19" />
  </svg>
);

export const IconCheck = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconX = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6"  y1="6" x2="18" y2="18" />
  </svg>
);
