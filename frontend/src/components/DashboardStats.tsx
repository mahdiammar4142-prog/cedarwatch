import type { DashboardStats as Stats, OutageType } from "../types";
import { OUTAGE_ICONS, OUTAGE_LABELS } from "../lib/constants";

const OUTAGE_TYPES: OutageType[] = ["ELECTRICITY", "INTERNET", "WATER"];

export function DashboardStats({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Live incidents" value={stats.activeIncidents} note="on the map" />
        <StatCard label="Reports today" value={stats.totalReportsToday} note="from neighbors" />
        <StatCard label="Areas hit" value={stats.affectedAreas.length} note="named places" />
        <StatCard
          label="Confirmed"
          value={stats.confidenceBreakdown.CONFIRMED}
          note="highest signal"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-display text-xl text-[var(--cedar-dark)]">By current</h2>
          <ul className="mt-4 space-y-2">
            {OUTAGE_TYPES.map((type) => (
              <li
                key={type}
                className="flex min-h-11 items-center justify-between rounded-2xl bg-[#f3ead6]/70 px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm">
                  <span>{OUTAGE_ICONS[type]}</span>
                  {OUTAGE_LABELS[type]}
                </span>
                <span className="font-display text-2xl">{stats.activeByType[type]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-xl text-[var(--cedar-dark)]">Confidence</h2>
          <ul className="mt-4 space-y-2">
            {(
              Object.entries(stats.confidenceBreakdown) as [
                keyof Stats["confidenceBreakdown"],
                number,
              ][]
            ).map(([level, count]) => (
              <li
                key={level}
                className="flex items-center justify-between rounded-2xl bg-[#f3ead6]/70 px-4 py-3 text-sm"
              >
                <span className="capitalize">{level.toLowerCase()}</span>
                <span className="font-display text-xl">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {stats.affectedAreas.length > 0 && (
        <section className="panel p-5">
          <h2 className="font-display text-xl text-[var(--cedar-dark)]">Places on the board</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.affectedAreas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-[var(--cedar-dark)]/15 bg-[#fffaf1] px-3 py-1 text-sm"
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
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="ticket px-4 py-5">
      <p className="pl-3 text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="font-display mt-1 pl-3 text-4xl text-[var(--cedar-dark)]">{value}</p>
      <p className="pl-3 text-xs text-stone-500">{note}</p>
    </div>
  );
}
