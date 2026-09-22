from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models import ConfidenceLevel, IncidentStatus, OutageType


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
        serialize_by_alias=True,
    )


class ReportCreate(CamelModel):
    type: OutageType
    latitude: float
    longitude: float
    governorate: str
    district: str
    municipality: str | None = None
    area: str | None = None
    description: str | None = None


class ConfirmationOut(CamelModel):
    id: int
    report_id: int
    user_id: str | None = None
    created_at: datetime


class IncidentOut(CamelModel):
    id: int
    type: OutageType
    latitude: float
    longitude: float
    area: str | None
    governorate: str | None = None
    district: str | None = None
    municipality: str | None = None
    confidence: ConfidenceLevel
    status: IncidentStatus
    report_count: int
    confirmation_count: int
    agent_failure_count: int
    started_at: datetime
    resolved_at: datetime | None
    updated_at: datetime | None = None
    can_resolve: bool = False


class ReportOut(CamelModel):
    id: int
    type: OutageType
    latitude: float
    longitude: float
    area: str | None
    governorate: str | None = None
    district: str | None = None
    municipality: str | None = None
    description: str | None
    created_at: datetime
    user_id: str | None = None
    incident_id: int | None
    confirmations: list[ConfirmationOut] = []
    incident: IncidentOut | None = None


class ReportCreated(CamelModel):
    report: ReportOut
    incident: IncidentOut


class AgentCheckCreate(CamelModel):
    agent_id: str
    latitude: float
    longitude: float
    area: str | None = None
    is_connected: bool
    latency_ms: float | None = None
    dns_ok: bool | None = None
    packet_loss: float | None = None


class AgentCheckOut(CamelModel):
    id: int
    agent_id: str
    is_connected: bool
    latency_ms: float | None
    dns_ok: bool | None
    packet_loss: float | None
    created_at: datetime


class AgentCheckCreated(CamelModel):
    check: AgentCheckOut
    incident: IncidentOut | None = None


class DashboardStats(CamelModel):
    active_incidents: int
    active_by_type: dict[OutageType, int]
    total_reports_today: int
    affected_areas: list[str]
    confidence_breakdown: dict[ConfidenceLevel, int]


class MeOut(CamelModel):
    id: str
    email: str | None
    display_name: str | None = None
    area: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    is_admin: bool = False


class MeUpdate(CamelModel):
    display_name: str | None = None
    area: str | None = None
    bio: str | None = None


class ReportUpdate(CamelModel):
    type: OutageType | None = None
    latitude: float | None = None
    longitude: float | None = None
    governorate: str | None = None
    district: str | None = None
    municipality: str | None = None
    area: str | None = None
    description: str | None = None


class IncidentAdminUpdate(CamelModel):
    type: OutageType | None = None
    latitude: float | None = None
    longitude: float | None = None
    area: str | None = None
    status: IncidentStatus | None = None
    confidence: ConfidenceLevel | None = None


class AdminUserOut(CamelModel):
    id: str
    email: str | None = None
    display_name: str | None = None
    area: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    is_admin: bool = False
    report_count: int = 0
    confirmation_count: int = 0
    updated_at: datetime | None = None
    bootstrap_admin: bool = False


class AdminUserUpdate(CamelModel):
    display_name: str | None = None
    area: str | None = None
    bio: str | None = None
    is_admin: bool | None = None


class AdminReportOut(CamelModel):
    id: int
    type: OutageType
    latitude: float
    longitude: float
    area: str | None
    governorate: str | None = None
    district: str | None = None
    municipality: str | None = None
    description: str | None
    created_at: datetime
    user_id: str | None = None
    reporter_email: str | None = None
    reporter_name: str | None = None
    incident_id: int | None
    confirmation_count: int = 0


class AdminOverview(CamelModel):
    users: int
    reports: int
    active_incidents: int
    resolved_incidents: int
    admins: int


class AreaReliability(CamelModel):
    area: str
    total_incidents: int
    active_incidents: int
    resolved_incidents: int
    electricity: int
    internet: int
    water: int
    avg_duration_hours: float | None
    reliability_score: int


class TrendPoint(CamelModel):
    date: str
    count: int


class HistoryOverview(CamelModel):
    total_incidents: int
    resolved_last_7_days: int
    recent_incidents: list[IncidentOut]
    by_area: list[AreaReliability]
    trends: list[TrendPoint]
