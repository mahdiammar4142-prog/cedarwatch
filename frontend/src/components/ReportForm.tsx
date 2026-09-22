import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { OutageType } from "../types";
import { LEBANON_CENTER, OUTAGE_LABELS } from "../lib/constants";
import { GOVERNORATES, LEBANON_PLACES } from "../lib/places";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { getCurrentLocation } from "../lib/geo";

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
  const [governorate, setGovernorate] = useState("");
  const [district, setDistrict] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
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
        governorate,
        district,
        municipality: municipality || undefined,
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

  async function useMyLocation() {
    setError(null);
    setLocating(true);
    try {
      const { lat, lng } = await getCurrentLocation();
      setLatitude(lat.toFixed(5));
      setLongitude(lng.toFixed(5));
      onLocationSelect?.(lat, lng);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get your location");
    } finally {
      setLocating(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 panel p-4 sm:p-5"
    >
      <div>
        <h2 className="font-display text-2xl text-[var(--cedar-dark)]">
          File a field report
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Share what you&apos;re experiencing in your area.
        </p>
        {!user && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <Link to="/" state={{ from: "/map" }} className="font-medium underline">
              Come on watch
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
              className={`min-h-11 rounded-lg border px-1.5 py-2 text-xs transition sm:px-3 sm:text-sm ${
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="governorate" className="mb-1 block text-sm font-medium">
            Governorate
          </label>
          <select
            id="governorate"
            required
            value={governorate}
            onChange={(e) => {
              setGovernorate(e.target.value);
              setDistrict("");
            }}
            className="field"
          >
            <option value="">Select governorate</option>
            {GOVERNORATES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="district" className="mb-1 block text-sm font-medium">
            District
          </label>
          <select
            id="district"
            required
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            disabled={!governorate}
            className="field"
          >
            <option value="">Select district</option>
            {(LEBANON_PLACES[governorate] ?? []).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="municipality" className="mb-1 block text-sm font-medium">
          Municipality / town
        </label>
        <input
          id="municipality"
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          placeholder="e.g. Bourj Hammoud"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="area" className="mb-1 block text-sm font-medium">
          Neighborhood
        </label>
        <input
          id="area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. Hamra"
          className="field"
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
            className="field"
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
            className="field"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => void useMyLocation()}
        disabled={locating}
        className="min-h-11 w-full rounded-full border border-[var(--cedar-green)] px-3 py-2 text-sm font-medium text-[var(--cedar-green)] disabled:opacity-60"
      >
        {locating ? "Finding you..." : "Use my current location"}
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
          className="field"
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
        className="btn-primary w-full disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit report"}
      </button>
    </form>
  );
}
