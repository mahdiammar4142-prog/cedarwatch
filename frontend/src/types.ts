export type OutageType = "ELECTRICITY" | "INTERNET" | "WATER";
export type ConfidenceLevel = "UNVERIFIED" | "POSSIBLE" | "LIKELY" | "CONFIRMED";
export type IncidentStatus = "ACTIVE" | "RESOLVED";

export interface Incident {
  id: number;
  type: OutageType;
  latitude: number;
  longitude: number;
  area: string | null;
  confidence: ConfidenceLevel;
  status: IncidentStatus;
  reportCount: number;
  confirmationCount: number;
  agentFailureCount: number;
  startedAt: string;
  resolvedAt: string | null;
}

export interface DashboardStats {
  activeIncidents: number;
  activeByType: Record<OutageType, number>;
  totalReportsToday: number;
  affectedAreas: string[];
  confidenceBreakdown: Record<ConfidenceLevel, number>;
}

export interface AreaReliability {
  area: string;
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  electricity: number;
  internet: number;
  water: number;
  avgDurationHours: number | null;
  reliabilityScore: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface HistoryOverview {
  totalIncidents: number;
  resolvedLast7Days: number;
  recentIncidents: Incident[];
  byArea: AreaReliability[];
  trends: TrendPoint[];
}
