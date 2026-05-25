import { epcCorto } from '../utils/format.js';

/**
 * Inline EPC pill. Used wherever a tag reference needs to be visible without
 * taking much space — anomaly alerts, event rows, OC summaries.
 *
 * Optional `sku` prop adds a separator + SKU after the EPC, mirroring the
 * upload's behavior.
 */
export function TagBadge({ tag, showSku = false }) {
  if (!tag) return null;

  return (
    <span className={
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ' +
      'font-mono text-[11px] ' +
      'bg-blue-50 border border-rfid/30 text-rfid ' +
      'dark:bg-rfid/15 dark:border-rfid/40 dark:text-blue-300'
    }>
      <span className="truncate max-w-[140px]">{epcCorto(tag.epc)}</span>
      {showSku && tag.sku && (
        <>
          <span className="opacity-50">·</span>
          <span className="truncate max-w-[80px]">{tag.sku}</span>
        </>
      )}
    </span>
  );
}
