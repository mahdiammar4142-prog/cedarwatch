import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { OutageType } from "../types";
import { LEBANON_CENTER, OUTAGE_LABELS } from "../lib/constants";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

const OUTAGE_TYPES: OutageType[] = ["ELECTRICITY", "INTERNET", "WATER"];

interface ReportFormProps {
  defaultLat?: number;
  defaultLng?: number;
  onSuccess?: () => void;
  onLocationSelect?: (lat: number, lng: number) => void;
}

export function ReportForm({
  defaultLat = LEBANON_CENTER.latitude,
  defaultLng = LEBANON_CENTER.longitude,
  onSuccess,
  onLocationSelect,
}: ReportFormProps) {
  const { user } = useAuth();
  const [type, setType] = useState<OutageType>("ELECTRICITY");
  const [latitude, setLatitude] = useState(defaultLat.toFixed(5));
  const [longitude, setLongitude] = useState(defaultLng.toFixed(5));
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLatitude(defaultLat.toFixed(5));
    setLongitude(defaultLng.toFixed(5));
  }, [defaultLat, defaultLng]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await api.createReport({
        type,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        area: area || undefined,
        description: description || undefined,
      });
      setMessage("Report submitted. Thank you for helping your community.");
      setDescription("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat.toFixed(5));
        setLongitude(lng.toFixed(5));
        setError(null);
        onLocationSelect?.(lat, lng);
      },
      () => setError("Could not get your location")
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-emerald-900/10 bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-[var(--cedar-dark)]">
          Report an outage
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Share what you&apos;re experiencing in your area.
        </p>
        {!user && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <Link to="/login" state={{ from: "/map" }} className="font-medium underline">
              Sign in
            </Link>{" "}
            or{" "}
            <Link to="/signup" state={{ from: "/map" }} className="font-medium underline">
              create an account
            </Link>{" "}
            to submit a report.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Outage type</label>
        <div className="grid grid-cols-3 gap-2">
          {OUTAGE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                type === t
                  ? "border-[var(--cedar-green)] bg-emerald-50 font-medium text-[var(--cedar-dark)]"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {OUTAGE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="area" className="mb-1 block text-sm font-medium">
          Area / neighborhood
        </label>
        <input
          id="area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. Hamra, Beirut"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--cedar-green)] focus:outline-none focus:ring-1 focus:ring-[var(--cedar-green)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="lat" className="mb-1 block text-sm font-medium">
            Latitude
          </label>
          <input
            id="lat"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--cedar-green)] focus:outline-none focus:ring-1 focus:ring-[var(--cedar-green)]"
          />
        </div>
        <div>
          <label htmlFor="lng" className="mb-1 block text-sm font-medium">
            Longitude
          </label>
          <input
            id="lng"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--cedar-green)] focus:outline-none focus:ring-1 focus:ring-[var(--cedar-green)]"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        className="text-sm font-medium text-[var(--cedar-green)] hover:underline"
      >
        Use my current location
      </button>

      <div>
        <label htmlFor="desc" className="mb-1 block text-sm font-medium">
          Details (optional)
        </label>
        <textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Power went out around 3 PM, still down..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--cedar-green)] focus:outline-none focus:ring-1 focus:ring-[var(--cedar-green)]"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !user}
        className="w-full rounded-lg bg-[var(--cedar-green)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--cedar-green-light)] disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit report"}
      </button>
    </form>
  );
}
