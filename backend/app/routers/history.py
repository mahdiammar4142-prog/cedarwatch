from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Incident, IncidentStatus, OutageType
from app.schemas import AreaReliability, HistoryOverview, TrendPoint

router = APIRouter(prefix="/api/history", tags=["history"])


def utc_date(value: datetime):
    if value.tzinfo is None:
        return value.date()
    return value.astimezone(timezone.utc).date()


@router.get("", response_model=HistoryOverview)
def get_history(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    incidents = db.query(Incident).order_by(Incident.started_at.desc()).all()

    resolved_last_7_days = sum(
        1
        for incident in incidents
        if incident.status == IncidentStatus.RESOLVED
        and incident.resolved_at
        and incident.resolved_at >= week_ago
    )

    grouped: dict[str, list[Incident]] = defaultdict(list)
    for incident in incidents:
        grouped[incident.area or "Unknown area"].append(incident)

    by_area: list[AreaReliability] = []
    for area, items in grouped.items():
        active = [i for i in items if i.status == IncidentStatus.ACTIVE]
        resolved = [i for i in items if i.status == IncidentStatus.RESOLVED]
        durations = [
            (i.resolved_at - i.started_at).total_seconds() / 3600
            for i in resolved
            if i.resolved_at and i.started_at
        ]
        avg_hours = round(sum(durations) / len(durations), 1) if durations else None
        score = max(0, 100 - len(active) * 20 - len(resolved) * 6)
        by_area.append(
            AreaReliability(
                area=area,
                total_incidents=len(items),
                active_incidents=len(active),
                resolved_incidents=len(resolved),
                electricity=sum(1 for i in items if i.type == OutageType.ELECTRICITY),
                internet=sum(1 for i in items if i.type == OutageType.INTERNET),
                water=sum(1 for i in items if i.type == OutageType.WATER),
                avg_duration_hours=avg_hours,
                reliability_score=score,
            )
        )

    by_area.sort(key=lambda row: (row.active_incidents, row.total_incidents), reverse=True)

    trends: list[TrendPoint] = []
    for offset in range(13, -1, -1):
        day = (now - timedelta(days=offset)).date()
        count = sum(
            1
            for incident in incidents
            if incident.started_at and utc_date(incident.started_at) == day
        )
        trends.append(TrendPoint(date=day.isoformat(), count=count))

    return HistoryOverview(
        total_incidents=len(incidents),
        resolved_last_7_days=resolved_last_7_days,
        recent_incidents=incidents[:40],
        by_area=by_area,
        trends=trends,
    )
