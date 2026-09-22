import type { ConfidenceLevel } from "../types";
import { CONFIDENCE_BADGE } from "../lib/constants";

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const badge = CONFIDENCE_BADGE[level];
  return (
    <span
      className={`stamp ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}
