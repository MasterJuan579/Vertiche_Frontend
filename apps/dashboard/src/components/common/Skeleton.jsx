export function Skeleton({ height = 120 }) {
  return (
    <div
      className="animate-skeleton rounded-card mb-4 bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 dark:from-ink-600 dark:via-ink-500 dark:to-ink-600"
      style={{ minHeight: height }}
    />
  );
}
