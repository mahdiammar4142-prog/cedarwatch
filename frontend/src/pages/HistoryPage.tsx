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
            <p className="stamp text-[var(--cedar-green)]">The log</p>
            <h1 className="font-display mt-2 text-3xl text-[var(--cedar-dark)] sm:text-4xl">
          Outage history
        </h1>
        <p className="mt-2 text-sm text-stone-600 sm:text-base">
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
