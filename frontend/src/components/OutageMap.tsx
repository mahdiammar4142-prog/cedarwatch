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
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl border border-emerald-900/10 shadow-sm">
      <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-lg border border-emerald-900/10 bg-white text-sm shadow-sm">
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
                <p className="text-sm">{incident.area ?? "Unknown area"}</p>
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
