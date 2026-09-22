import { useState } from "react";
import type { Incident } from "../types";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { OutageTypeBadge } from "./OutageTypeBadge";

interface IncidentListProps {
  incidents: Incident[];
  onConfirm?: (id: number) => Promise<void> | void;
  onResolve?: (id: number) => Promise<void> | void;
  showActions?: boolean;
  emptyLabel?: string;
}

export function IncidentList({
  incidents,
  onConfirm,
  onResolve,
  showActions = false,
  emptyLabel = "No active incidents right now.",
}: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <div className="panel p-8 text-center text-stone-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          onConfirm={onConfirm}
          onResolve={onResolve}
          showActions={showActions}
        />
      ))}
    </div>
  );
}

function IncidentCard({
  incident,
  onConfirm,
  onResolve,
  showActions,
}: {
  incident: Incident;
  onConfirm?: (id: number) => Promise<void> | void;
  onResolve?: (id: number) => Promise<void> | void;
  showActions?: boolean;
}) {
  const [loading, setLoading] = useState<"confirm" | "resolve" | null>(null);

  async function handleConfirm() {
    if (!onConfirm) return;
    setLoading("confirm");
    try {
      await onConfirm(incident.id);
    } finally {
      setLoading(null);
    }
  }

  async function handleResolve() {
    if (!onResolve) return;
    setLoading("resolve");
    try {
      await onResolve(incident.id);
    } finally {
      setLoading(null);
    }
  }

  return (
    <article className="ticket p-4 pl-5">
      <div className="flex flex-wrap items-center gap-2">
        <OutageTypeBadge type={incident.type} />
        <ConfidenceBadge level={incident.confidence} />
      </div>
      <h3 className="font-display mt-2 text-xl text-[var(--cedar-dark)]">
        {incident.area ?? incident.municipality ?? incident.district ?? "Unknown area"}
      </h3>
      {(incident.governorate || incident.district) && (
        <p className="mt-1 text-sm text-stone-600">
          {[incident.district, incident.governorate].filter(Boolean).join(" · ")}
          {incident.municipality ? ` · ${incident.municipality}` : ""}
        </p>
      )}
      <dl className="mt-3 grid grid-cols-3 gap-1 text-center text-xs sm:gap-2 sm:text-sm">
        <div className="rounded-2xl bg-[#f3ead6]/80 p-2">
          <dt className="text-[10px] text-stone-500 sm:text-xs">Reports</dt>
          <dd className="font-semibold">{incident.reportCount}</dd>
        </div>
        <div className="rounded-2xl bg-[#f3ead6]/80 p-2">
          <dt className="text-[10px] text-stone-500 sm:text-xs">Confirmations</dt>
          <dd className="font-semibold">{incident.confirmationCount}</dd>
        </div>
        <div className="rounded-2xl bg-[#f3ead6]/80 p-2">
          <dt className="text-[10px] text-stone-500 sm:text-xs">Agents</dt>
          <dd className="font-semibold">{incident.agentFailureCount}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-stone-500">
        Started {new Date(incident.startedAt).toLocaleString()}
      </p>
      {showActions && (onConfirm || onResolve) && incident.status === "ACTIVE" && (
        <div className="mt-3 grid gap-2">
          {onConfirm && (
            <button
              onClick={handleConfirm}
              disabled={loading !== null}
              className="min-h-11 rounded-full border border-[var(--cedar-green)] px-3 py-2 text-sm font-medium text-[var(--cedar-green)] disabled:opacity-60"
            >
              {loading === "confirm" ? "Confirming..." : "I can confirm this"}
            </button>
          )}
          {onResolve && incident.canResolve && (
            <button
              onClick={handleResolve}
              disabled={loading !== null}
              className="min-h-11 rounded-full border border-stone-300 px-3 py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading === "resolve" ? "Updating..." : "Service is back"}
            </button>
          )}
          {onResolve && !incident.canResolve && (
            <p className="text-xs text-stone-500">
              Only someone who reported this outage can mark Service is back.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
