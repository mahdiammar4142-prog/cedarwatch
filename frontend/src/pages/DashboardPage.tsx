import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { DashboardStats } from "../components/DashboardStats";
import { Faq } from "../components/Faq";
import { IncidentList } from "../components/IncidentList";
import { api } from "../lib/api";
import type { DashboardStats as Stats, Incident } from "../types";

const EMPTY_STATS: Stats = {
  activeIncidents: 0,
  activeByType: { ELECTRICITY: 0, INTERNET: 0, WATER: 0 },
  totalReportsToday: 0,
  affectedAreas: [],
  confidenceBreakdown: {
    UNVERIFIED: 0,
    POSSIBLE: 0,
    LIKELY: 0,
    CONFIRMED: 0,
  },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getStats(), api.getIncidents()])
      .then(([nextStats, nextIncidents]) => {
        setStats(nextStats as Stats);
        setIncidents(nextIncidents as Incident[]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[var(--cedar-dark)] px-6 py-8 text-white sm:px-8">
        <p className="text-sm font-medium text-emerald-300">
          Lebanon Infrastructure Monitoring
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          CedarWatch Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-emerald-100">
          Track active electricity, internet, and water outages across Lebanon.
          Reports from the community and monitoring agents are grouped and scored
          for confidence.
        </p>
        <Link
          to="/map"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-400"
        >
          View live map
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/history"
          className="mt-5 ml-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
        >
          Outage history
        </Link>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}. Start PostgreSQL and the Python API, then refresh.
        </p>
      )}

      <DashboardStats stats={stats} />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--cedar-dark)]">
            Active incidents
          </h2>
          <Link
            to="/map"
            className="text-sm font-medium text-[var(--cedar-green)] hover:underline"
          >
            Report or view on map
          </Link>
        </div>
        <IncidentList incidents={incidents} />
      </section>

      <Faq />
    </div>
  );
}
