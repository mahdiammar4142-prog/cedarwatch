import type { ConfidenceLevel } from "../types";
import { CONFIDENCE_BADGE } from "../lib/constants";

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const badge = CONFIDENCE_BADGE[level];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}
