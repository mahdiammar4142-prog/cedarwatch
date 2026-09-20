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
    confidence: ConfidenceLevel
    status: IncidentStatus
    report_count: int
    confirmation_count: int
    agent_failure_count: int
    started_at: datetime
    resolved_at: datetime | None
    updated_at: datetime | None = None


class ReportOut(CamelModel):
    id: int
    type: OutageType
    latitude: float
    longitude: float
    area: str | None
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
