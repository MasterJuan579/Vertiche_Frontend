export function Subbar() {
  return (
    <div className="flex items-center flex-wrap gap-[18px] bg-ink-50 dark:bg-ink-600 border-b border-ink-100 dark:border-ink-600 px-6 py-2.5 text-ink-400 dark:text-ink-300 text-[11px] font-bold tracking-industrial uppercase">
      <span>CEDI Lerma</span>
      <span>RFID operativo</span>
      <span>API: {import.meta.env.VITE_API_URL || 'http://localhost:8080'}</span>
    </div>
  );
}
