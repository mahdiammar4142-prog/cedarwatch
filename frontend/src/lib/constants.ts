export const OUTAGE_LABELS = {
  ELECTRICITY: "Electricity",
  INTERNET: "Internet",
  WATER: "Water",
} as const;

export const OUTAGE_ICONS = {
  ELECTRICITY: "⚡",
  INTERNET: "🌐",
  WATER: "💧",
} as const;

export const OUTAGE_COLORS = {
  ELECTRICITY: "#eab308",
  INTERNET: "#3b82f6",
  WATER: "#06b6d4",
} as const;

export const CONFIDENCE_COLORS = {
  UNVERIFIED: "#94a3b8",
  POSSIBLE: "#fbbf24",
  LIKELY: "#f97316",
  CONFIRMED: "#ef4444",
} as const;

export const CONFIDENCE_BADGE = {
  UNVERIFIED: { label: "Unverified", className: "bg-slate-200 text-slate-700" },
  POSSIBLE: { label: "Possible", className: "bg-amber-100 text-amber-800" },
  LIKELY: { label: "Likely", className: "bg-orange-100 text-orange-800" },
  CONFIRMED: { label: "Confirmed", className: "bg-red-100 text-red-800" },
} as const;

export const LEBANON_CENTER = { latitude: 33.8547, longitude: 35.8623 };

export type MapLanguage = "en" | "ar";

export const MAP_LANGUAGE_KEY = "cedarwatch-map-lang";

export const MAP_TILES: Record<
  MapLanguage,
  { url: string; attribution: string }
> = {
  en: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, USGS, NGA, EPA, USDA, NPS",
  },
  ar: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};
