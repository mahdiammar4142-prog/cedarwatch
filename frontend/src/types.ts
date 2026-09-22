export type OutageType = "ELECTRICITY" | "INTERNET" | "WATER";
export type ConfidenceLevel = "UNVERIFIED" | "POSSIBLE" | "LIKELY" | "CONFIRMED";
export type IncidentStatus = "ACTIVE" | "RESOLVED";

export interface Incident {
  id: number;
  type: OutageType;
  latitude: number;
  longitude: number;
  area: string | null;
  governorate?: string | null;
  district?: string | null;
  municipality?: string | null;
  confidence: ConfidenceLevel;
  status: IncidentStatus;
  reportCount: number;
  confirmationCount: number;
  agentFailureCount: number;
  startedAt: string;
  resolvedAt: string | null;
  canResolve?: boolean;
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

export interface Profile {
  id: string;
  email: string | null;
  displayName: string | null;
  area: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isAdmin?: boolean;
}

export interface AdminUser {
  id: string;
  email: string | null;
  displayName: string | null;
  area: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  reportCount: number;
  confirmationCount: number;
  updatedAt: string | null;
  bootstrapAdmin: boolean;
}

export interface AdminReport {
  id: number;
  type: OutageType;
  latitude: number;
  longitude: number;
  area: string | null;
  governorate?: string | null;
  district?: string | null;
  municipality?: string | null;
  description: string | null;
  createdAt: string;
  userId: string | null;
  reporterEmail: string | null;
  reporterName: string | null;
  incidentId: number | null;
  confirmationCount: number;
}

export interface AdminOverview {
  users: number;
  reports: number;
  activeIncidents: number;
  resolvedIncidents: number;
  admins: number;
}
