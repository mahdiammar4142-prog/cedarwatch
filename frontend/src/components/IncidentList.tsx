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
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
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
    <article className="rounded-xl border border-emerald-900/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <OutageTypeBadge type={incident.type} />
        <ConfidenceBadge level={incident.confidence} />
      </div>
      <h3 className="mt-2 font-medium text-[var(--cedar-dark)]">
        {incident.area ?? "Unknown area"}
      </h3>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-xs text-slate-500">Reports</dt>
          <dd className="font-semibold">{incident.reportCount}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-xs text-slate-500">Confirmations</dt>
          <dd className="font-semibold">{incident.confirmationCount}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-xs text-slate-500">Agents</dt>
          <dd className="font-semibold">{incident.agentFailureCount}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-slate-500">
        Started {new Date(incident.startedAt).toLocaleString()}
      </p>
      {showActions && (onConfirm || onResolve) && incident.status === "ACTIVE" && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {onConfirm && (
            <button
              onClick={handleConfirm}
              disabled={loading !== null}
              className="rounded-lg border border-[var(--cedar-green)] px-3 py-2 text-sm font-medium text-[var(--cedar-green)] transition hover:bg-emerald-50 disabled:opacity-60"
            >
              {loading === "confirm" ? "Confirming..." : "I can confirm this"}
            </button>
          )}
          {onResolve && (
            <button
              onClick={handleResolve}
              disabled={loading !== null}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loading === "resolve" ? "Updating..." : "Service is back"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
