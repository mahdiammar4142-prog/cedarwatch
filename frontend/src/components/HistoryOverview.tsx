import type { AreaReliability, HistoryOverview, Incident } from "../types";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { OutageTypeBadge } from "./OutageTypeBadge";

export function HistoryOverviewView({ data }: { data: HistoryOverview }) {
  const maxTrend = Math.max(1, ...data.trends.map((point) => point.count));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="All recorded incidents" value={data.totalIncidents} />
        <StatCard label="Resolved in last 7 days" value={data.resolvedLast7Days} />
      </div>

      <section className="rounded-xl border border-emerald-900/10 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-[var(--cedar-dark)]">
          New incidents (14 days)
        </h2>
        <div className="mt-4 flex h-36 items-end gap-1">
          {data.trends.map((point) => (
            <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-emerald-600/80"
                style={{ height: `${(point.count / maxTrend) * 100}%`, minHeight: point.count ? 4 : 0 }}
                title={`${point.date}: ${point.count}`}
              />
              <span className="text-[10px] text-slate-400">
                {point.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-emerald-900/10 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-[var(--cedar-dark)]">
          Reliability by area
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Higher score means fewer recorded outages. Active outages lower the
          score more than old ones.
        </p>
        {data.byArea.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No area data yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Area</th>
                  <th className="pb-2 font-medium">Score</th>
                  <th className="pb-2 font-medium">Active</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Avg hours</th>
                  <th className="pb-2 font-medium">Types</th>
                </tr>
              </thead>
              <tbody>
                {data.byArea.map((row) => (
                  <AreaRow key={row.area} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-[var(--cedar-dark)]">
          Incident log
        </h2>
        <HistoryList incidents={data.recentIncidents} />
      </section>
    </div>
  );
}

function AreaRow({ row }: { row: AreaReliability }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="py-3 font-medium text-[var(--cedar-dark)]">{row.area}</td>
      <td className="py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            row.reliabilityScore >= 80
              ? "bg-emerald-50 text-emerald-800"
              : row.reliabilityScore >= 50
                ? "bg-amber-50 text-amber-800"
                : "bg-red-50 text-red-800"
          }`}
        >
          {row.reliabilityScore}
        </span>
      </td>
      <td className="py-3">{row.activeIncidents}</td>
      <td className="py-3">{row.totalIncidents}</td>
      <td className="py-3">
        {row.avgDurationHours == null ? "—" : row.avgDurationHours}
      </td>
      <td className="py-3 text-slate-600">
        ⚡{row.electricity} · 🌐{row.internet} · 💧{row.water}
      </td>
    </tr>
  );
}

function HistoryList({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        No incidents recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <article
          key={incident.id}
          className="rounded-xl border border-emerald-900/10 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <OutageTypeBadge type={incident.type} />
            <ConfidenceBadge level={incident.confidence} />
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                incident.status === "ACTIVE"
                  ? "bg-red-50 text-red-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {incident.status === "ACTIVE" ? "Active" : "Resolved"}
            </span>
          </div>
          <h3 className="mt-2 font-medium text-[var(--cedar-dark)]">
            {incident.area ?? "Unknown area"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Started {new Date(incident.startedAt).toLocaleString()}
            {incident.resolvedAt
              ? ` · Restored ${new Date(incident.resolvedAt).toLocaleString()}`
              : ""}
          </p>
        </article>
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[var(--cedar-dark)]">{value}</p>
    </div>
  );
}
