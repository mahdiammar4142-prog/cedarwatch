import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IncidentList } from "../components/IncidentList";
import { OutageMap } from "../components/OutageMap";
import { ReportForm } from "../components/ReportForm";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LEBANON_CENTER } from "../lib/constants";
import type { Incident } from "../types";

export default function MapPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    const data = (await api.getIncidents()) as Incident[];
    setIncidents(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchIncidents().catch(() => setLoading(false));
    const interval = setInterval(() => {
      fetchIncidents().catch(() => undefined);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  async function handleConfirm(incidentId: number) {
    await api.confirmIncident(incidentId);
    await fetchIncidents();
  }

  async function handleResolve(incidentId: number) {
    await api.resolveIncident(incidentId);
    await fetchIncidents();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="stamp text-[var(--cedar-green)]">Pin it</p>
        <h1 className="font-display mt-2 text-3xl text-[var(--cedar-dark)] sm:text-4xl">
          Live outage map
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 sm:text-base">
          Tap the map, then file a report. Switch EN / العربية for place names.
          Only a reporter of that outage can mark Service is back.
        </p>
      </div>

      <OutageMap
        incidents={incidents}
        onMapClick={(lat, lng) => setSelectedPosition({ lat, lng })}
        selectedPosition={selectedPosition}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportForm
          defaultLat={selectedPosition?.lat ?? LEBANON_CENTER.latitude}
          defaultLng={selectedPosition?.lng ?? LEBANON_CENTER.longitude}
          onSuccess={fetchIncidents}
          onLocationSelect={(lat, lng) => setSelectedPosition({ lat, lng })}
        />
        <div>
          <h2 className="font-display mb-4 text-2xl text-[var(--cedar-dark)]">
            Active incidents
            {!loading && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({incidents.length})
              </span>
            )}
          </h2>
          {loading ? (
            <p className="text-slate-500">Loading incidents...</p>
          ) : (
            <>
              <IncidentList
                incidents={incidents}
                showActions={Boolean(user)}
                onConfirm={handleConfirm}
                onResolve={handleResolve}
              />
              {!user && (
                <p className="mt-3 text-sm text-slate-600">
                  <Link
                    to="/"
                    state={{ from: "/map" }}
                    className="font-medium text-[var(--cedar-green)] hover:underline"
                  >
                    Come on watch
                  </Link>{" "}
                  to confirm an outage.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
