import { useAuth } from '@vertiche/design-system';

/**
 * Top bar identifying the logged-in operator. Pulls the real user from
 * useAuth() instead of using hardcoded mock data.
 *
 * The employee ID is derived deterministically from the user's `sub` claim
 * so it's stable across sessions. Station and counter values come from props
 * because they're context-specific (which bay, which review cycle).
 */
export function OperatorBar({
  station = 'Arco RFID Bahía 02',
  status = 'BAHÍA ACTIVA',
  counterLabel = 'Revisión',
  counterValue = 1,
}) {
  const { session } = useAuth();
  const user = session?.user;
  if (!user) return null;

  const name = user.name || 'Operador';
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  // Stable 4-digit employee ID derived from the user's sub.
  const employeeId = String(
    Math.abs(hashCode(user.sub || name)) % 10000
  ).padStart(4, '0');

  return (
    <div
      className={
        'flex items-center gap-3.5 mb-4 px-4 py-3 ' +
        'bg-white border border-ink-100 rounded-card shadow-card ' +
        'dark:bg-ink-700 dark:border-ink-600'
      }
    >
      {/* Avatar */}
      <div
        className={
          'shrink-0 w-11 h-11 rounded-full flex items-center justify-center ' +
          'bg-blue-50 border border-rfid/30 font-display font-semibold text-sm text-rfid ' +
          'dark:bg-rfid/20 dark:border-rfid/40 dark:text-blue-300'
        }
      >
        {initials}
      </div>

      {/* Identity */}
      <div className="flex-1 min-w-0">
        <div className="font-display text-base font-semibold text-ink-700 dark:text-ink-100 truncate">
          {name}
        </div>
        <div className="text-[11px] text-ink-400 dark:text-ink-300 font-mono">
          Emp. {employeeId} · {station}
        </div>
      </div>

      {/* Status pill */}
      <div className="shrink-0 text-right">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-display font-semibold uppercase tracking-industrial text-flow dark:text-flow-ring">
          <span className="w-1.5 h-1.5 rounded-full bg-flow-ring shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
          {status}
        </div>
        <div className="mt-1 text-[10px] text-ink-400 dark:text-ink-400 uppercase tracking-industrial">
          {counterLabel} <span className="font-mono text-ink-700 dark:text-ink-100">#{counterValue}</span>
        </div>
      </div>
    </div>
  );
}

// Tiny deterministic hash — not cryptographic, just for generating a stable
// employee ID from a sub claim. djb2 variant.
function hashCode(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return h;
}
