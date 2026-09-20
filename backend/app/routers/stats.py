from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ConfidenceLevel, Incident, IncidentStatus, OutageType, Report
from app.schemas import DashboardStats

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    start_of_day = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    active = (
        db.query(Incident).filter(Incident.status == IncidentStatus.ACTIVE).all()
    )
    reports_today = (
        db.query(Report).filter(Report.created_at >= start_of_day).count()
    )

    active_by_type = {t: 0 for t in OutageType}
    confidence_breakdown = {c: 0 for c in ConfidenceLevel}
    areas: set[str] = set()

    for incident in active:
        active_by_type[incident.type] += 1
        confidence_breakdown[incident.confidence] += 1
        if incident.area:
            areas.add(incident.area)

    return DashboardStats(
        active_incidents=len(active),
        active_by_type=active_by_type,
        total_reports_today=reports_today,
        affected_areas=sorted(areas),
        confidence_breakdown=confidence_breakdown,
    )
