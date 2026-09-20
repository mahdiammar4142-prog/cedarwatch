import type { DashboardStats as Stats, OutageType } from "../types";
import { OUTAGE_ICONS, OUTAGE_LABELS } from "../lib/constants";

const OUTAGE_TYPES: OutageType[] = ["ELECTRICITY", "INTERNET", "WATER"];

export function DashboardStats({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active incidents" value={stats.activeIncidents} accent="bg-red-500" />
        <StatCard label="Reports today" value={stats.totalReportsToday} accent="bg-blue-500" />
        <StatCard
          label="Affected areas"
          value={stats.affectedAreas.length}
          accent="bg-amber-500"
        />
        <StatCard
          label="Confirmed outages"
          value={stats.confidenceBreakdown.CONFIRMED}
          accent="bg-emerald-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-emerald-900/10 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--cedar-dark)]">Active by type</h2>
          <ul className="mt-4 space-y-3">
            {OUTAGE_TYPES.map((type) => (
              <li
                key={type}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm">
                  <span>{OUTAGE_ICONS[type]}</span>
                  {OUTAGE_LABELS[type]}
                </span>
                <span className="text-lg font-semibold">{stats.activeByType[type]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-emerald-900/10 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--cedar-dark)]">
            Confidence breakdown
          </h2>
          <ul className="mt-4 space-y-3">
            {(
              Object.entries(stats.confidenceBreakdown) as [
                keyof Stats["confidenceBreakdown"],
                number,
              ][]
            ).map(([level, count]) => (
              <li
                key={level}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="capitalize">{level.toLowerCase()}</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {stats.affectedAreas.length > 0 && (
        <section className="rounded-xl border border-emerald-900/10 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--cedar-dark)]">Affected areas</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.affectedAreas.map((area) => (
              <span
                key={area}
                className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-[var(--cedar-dark)]"
              >
                {area}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className={`mb-3 h-1 w-10 rounded-full ${accent}`} />
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[var(--cedar-dark)]">{value}</p>
    </div>
  );
}
