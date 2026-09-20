import type { OutageType } from "../types";
import { OUTAGE_COLORS, OUTAGE_ICONS, OUTAGE_LABELS } from "../lib/constants";

export function OutageTypeBadge({ type }: { type: OutageType }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: OUTAGE_COLORS[type] }}
    >
      <span>{OUTAGE_ICONS[type]}</span>
      {OUTAGE_LABELS[type]}
    </span>
  );
}
