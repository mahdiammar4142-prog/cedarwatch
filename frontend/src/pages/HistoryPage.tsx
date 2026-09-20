import { useEffect, useState } from "react";
import { HistoryOverviewView } from "../components/HistoryOverview";
import { api } from "../lib/api";
import type { HistoryOverview } from "../types";

export default function HistoryPage() {
  const [data, setData] = useState<HistoryOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getHistory()
      .then((result) => setData(result as HistoryOverview))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load history")
      );
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--cedar-dark)]">
          Outage history
        </h1>
        <p className="mt-1 text-slate-600">
          Past incidents, how long they lasted, and a simple reliability score
          by area.
        </p>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {!data && !error && <p className="text-slate-500">Loading history...</p>}
      {data && <HistoryOverviewView data={data} />}
    </div>
  );
}
