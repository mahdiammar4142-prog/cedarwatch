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
  }, []);

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
        <h1 className="text-2xl font-bold text-[var(--cedar-dark)]">Live outage map</h1>
        <p className="mt-1 text-slate-600">
          Click the map to set a location, then submit a report. Marker size
          reflects report volume; color reflects confidence. Use EN / العربية on
          the map to switch place names.
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
          <h2 className="mb-4 text-lg font-semibold text-[var(--cedar-dark)]">
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
                    to="/login"
                    state={{ from: "/map" }}
                    className="font-medium text-[var(--cedar-green)] hover:underline"
                  >
                    Sign in
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
