import type { OutageType } from "../types";
import { OUTAGE_COLORS, OUTAGE_ICONS, OUTAGE_LABELS } from "../lib/constants";

export function OutageTypeBadge({ type }: { type: OutageType }) {
  return (
    <span
      className="stamp text-white"
      style={{ backgroundColor: OUTAGE_COLORS[type] }}
    >
      <span>{OUTAGE_ICONS[type]}</span>
      {OUTAGE_LABELS[type]}
    </span>
  );
}
