from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from app.auth import CurrentUser, get_current_user, get_optional_user
from app.database import get_db
from app.incidents import refresh_incident_confidence
from app.models import Confirmation, Incident, IncidentStatus, OutageType, Report
from app.schemas import ConfirmationOut, IncidentOut

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def reporter_ids(incident: Incident) -> set[str]:
    return {report.user_id for report in incident.reports if report.user_id}


def to_incident_out(incident: Incident, user: CurrentUser | None) -> IncidentOut:
    payload = IncidentOut.model_validate(incident)
    payload.can_resolve = bool(
        user
        and incident.status == IncidentStatus.ACTIVE
        and user.id in reporter_ids(incident)
    )
    return payload


@router.get("", response_model=list[IncidentOut])
def list_incidents(
    status: IncidentStatus = Query(default=IncidentStatus.ACTIVE),
    type: OutageType | None = None,
    db: Session = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_user),
):
    query = (
        db.query(Incident)
        .options(selectinload(Incident.reports))
        .filter(Incident.status == status)
    )
    if type:
        query = query.filter(Incident.type == type)
    incidents = query.order_by(Incident.updated_at.desc()).all()
    return [to_incident_out(incident, user) for incident in incidents]


@router.post("/{incident_id}/confirm", response_model=ConfirmationOut, status_code=201)
def confirm_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    incident = (
        db.query(Incident)
        .options(selectinload(Incident.reports))
        .filter(Incident.id == incident_id)
        .first()
    )
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident.reports:
        raise HTTPException(status_code=400, detail="No report linked to this incident")

    already = (
        db.query(Confirmation)
        .join(Report, Confirmation.report_id == Report.id)
        .filter(Report.incident_id == incident.id, Confirmation.user_id == user.id)
        .first()
    )
    if already:
        raise HTTPException(status_code=409, detail="You already confirmed this outage")

    confirmation = Confirmation(report_id=incident.reports[0].id, user_id=user.id)
    db.add(confirmation)
    db.flush()
    refresh_incident_confidence(db, incident)
    db.refresh(confirmation)
    return confirmation


@router.post("/{incident_id}/resolve", response_model=IncidentOut)
def resolve_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    incident = (
        db.query(Incident)
        .options(selectinload(Incident.reports))
        .filter(Incident.id == incident_id)
        .first()
    )
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if user.id not in reporter_ids(incident):
        raise HTTPException(
            status_code=403,
            detail="Only someone who reported this outage can mark it restored",
        )
    incident.status = IncidentStatus.RESOLVED
    incident.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(incident)
    return to_incident_out(incident, user)
