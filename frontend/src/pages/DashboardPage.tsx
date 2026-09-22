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
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[var(--cedar-dark)] px-5 py-8 text-[#fff8e7] sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#d4a017]/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-2xl" />
        <p className="stamp text-[#d4a017]">Lebanon · live grid</p>
        <p className="font-arabic mt-3 text-xl text-[#d4a017]/80" dir="rtl" lang="ar">
          من رأى انطفاء النور؟
        </p>
        <h1 className="font-display mt-3 max-w-xl text-4xl leading-tight sm:text-6xl">
          The lights went out.
          <span className="italic text-[#d4a017]"> Who saw it?</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm text-[#f3ead6]/80 sm:text-base">
          CedarWatch is a neighborhood lookout for electricity, internet, and
          water. Pin what you see. Confirm what your street already knows.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link to="/map" className="btn-primary">
            Open the live map
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/history" className="btn-ghost">
            Read the log
          </Link>
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}. Start PostgreSQL and the Python API, then refresh.
        </p>
      )}

      <DashboardStats stats={stats} />

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="stamp text-[var(--cedar-green)]">Now</p>
            <h2 className="font-display mt-2 text-2xl text-[var(--cedar-dark)]">
              Active field reports
            </h2>
          </div>
          <Link
            to="/map"
            className="text-sm font-medium text-[var(--cedar-green)] hover:underline"
          >
            Drop a pin
          </Link>
        </div>
        <IncidentList incidents={incidents} />
      </section>

      <Faq />
    </div>
  );
}
