import { LocateFixed } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Incident } from "../types";
import {
  CONFIDENCE_COLORS,
  LEBANON_CENTER,
  MAP_LANGUAGE_KEY,
  MAP_TILES,
  OUTAGE_COLORS,
  OUTAGE_LABELS,
  type MapLanguage,
} from "../lib/constants";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { getCurrentLocation } from "../lib/geo";

interface OutageMapProps {
  incidents: Incident[];
  onMapClick?: (lat: number, lng: number) => void;
  selectedPosition?: { lat: number; lng: number } | null;
}

function RecenterMap({
  position,
}: {
  position: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 13), {
      duration: 0.6,
    });
  }, [map, position]);
  return null;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function OutageMap({
  incidents,
  onMapClick,
  selectedPosition,
}: OutageMapProps) {
  const [language, setLanguage] = useState<MapLanguage>(() => {
    const stored = localStorage.getItem(MAP_LANGUAGE_KEY);
    return stored === "en" || stored === "ar" ? stored : "ar";
  });
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const tiles = MAP_TILES[language];

  useEffect(() => {
    localStorage.setItem(MAP_LANGUAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    import("leaflet").then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);

  return (
    <div className="relative h-[min(55vh,420px)] min-h-[260px] w-full overflow-hidden rounded-[1.25rem] border-4 border-[var(--cedar-dark)] shadow-[8px_10px_0_rgba(16,38,26,0.12)] sm:h-[500px] sm:min-h-0">
      <button
        type="button"
        aria-label="Use my current location"
        disabled={locating}
        onClick={async () => {
          setLocateError(null);
          setLocating(true);
          try {
            const pos = await getCurrentLocation();
            onMapClick?.(pos.lat, pos.lng);
          } catch (err) {
            setLocateError(
              err instanceof Error ? err.message : "Could not get your location"
            );
          } finally {
            setLocating(false);
          }
        }}
        className="absolute left-2 top-2 z-[1000] inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-emerald-900/10 bg-white text-[var(--cedar-dark)] shadow-sm disabled:opacity-60 sm:left-3 sm:top-3"
      >
        <LocateFixed className={`h-5 w-5 ${locating ? "animate-pulse" : ""}`} />
      </button>
      {locateError && (
        <p className="absolute bottom-2 left-2 right-2 z-[1000] rounded-xl bg-[#fffaf1] px-3 py-2 text-xs text-red-800 shadow sm:left-3 sm:right-3">
          {locateError}
        </p>
      )}
      <div className="absolute right-2 top-2 z-[1000] flex overflow-hidden rounded-lg border border-emerald-900/10 bg-white text-xs shadow-sm sm:right-3 sm:top-3 sm:text-sm">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`px-3 py-1.5 font-medium transition ${
            language === "en"
              ? "bg-[var(--cedar-green)] text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage("ar")}
          className={`px-3 py-1.5 font-medium transition ${
            language === "ar"
              ? "bg-[var(--cedar-green)] text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          العربية
        </button>
      </div>
      <MapContainer
        center={[LEBANON_CENTER.latitude, LEBANON_CENTER.longitude]}
        zoom={8}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          key={language}
          attribution={tiles.attribution}
          url={tiles.url}
        />
        <MapClickHandler onMapClick={onMapClick} />
        <RecenterMap position={selectedPosition ?? null} />
        {incidents.map((incident) => (
          <CircleMarker
            key={incident.id}
            center={[incident.latitude, incident.longitude]}
            radius={10 + incident.reportCount * 2}
            pathOptions={{
              color: OUTAGE_COLORS[incident.type],
              fillColor: CONFIDENCE_COLORS[incident.confidence],
              fillOpacity: 0.75,
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[180px] space-y-2">
                <p className="font-semibold">
                  {OUTAGE_LABELS[incident.type]} outage
                </p>
                <p className="text-sm">{incident.area ?? incident.municipality ?? "Unknown area"}</p>
                {(incident.district || incident.governorate) && (
                  <p className="text-xs text-slate-600">
                    {[incident.district, incident.governorate].filter(Boolean).join(" · ")}
                  </p>
                )}
                <ConfidenceBadge level={incident.confidence} />
                <p className="text-xs text-slate-600">
                  {incident.reportCount} reports · {incident.confirmationCount}{" "}
                  confirmations
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {selectedPosition && (
          <CircleMarker
            center={[selectedPosition.lat, selectedPosition.lng]}
            radius={8}
            pathOptions={{
              color: "#2d6a4f",
              fillColor: "#40916c",
              fillOpacity: 1,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
