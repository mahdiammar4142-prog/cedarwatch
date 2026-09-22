from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.admin_deps import (
    is_bootstrap_admin,
    require_admin,
    sync_profile,
)
from app.auth import CurrentUser
from app.database import get_db
from app.geo import is_in_lebanon
from app.incidents import recount_incident
from app.models import Confirmation, Incident, IncidentStatus, Profile, Report
from app.routers.profiles import _avatar_url, _clip
from app.schemas import (
    AdminOverview,
    AdminReportOut,
    AdminUserOut,
    AdminUserUpdate,
    IncidentAdminUpdate,
    IncidentOut,
    ReportUpdate,
)
from app.storage import AVATARS_DIR

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _user_out(profile: Profile, report_count: int, confirmation_count: int) -> AdminUserOut:
    return AdminUserOut(
        id=profile.user_id,
        email=profile.email,
        display_name=profile.display_name,
        area=profile.area,
        bio=profile.bio,
        avatar_url=_avatar_url(profile),
        is_admin=bool(profile.is_admin) or is_bootstrap_admin(profile.email),
        report_count=report_count,
        confirmation_count=confirmation_count,
        updated_at=profile.updated_at,
        bootstrap_admin=is_bootstrap_admin(profile.email),
    )


def _report_out(report: Report, profile: Profile | None) -> AdminReportOut:
    return AdminReportOut(
        id=report.id,
        type=report.type,
        latitude=report.latitude,
        longitude=report.longitude,
        area=report.area,
        governorate=report.governorate,
        district=report.district,
        municipality=report.municipality,
        description=report.description,
        created_at=report.created_at,
        user_id=report.user_id,
        reporter_email=profile.email if profile else None,
        reporter_name=profile.display_name if profile else None,
        incident_id=report.incident_id,
        confirmation_count=len(report.confirmations),
    )


@router.get("/overview", response_model=AdminOverview)
def overview(
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_admin),
):
    return AdminOverview(
        users=db.query(func.count(Profile.user_id)).scalar() or 0,
        reports=db.query(func.count(Report.id)).scalar() or 0,
        active_incidents=db.query(func.count(Incident.id))
        .filter(Incident.status == IncidentStatus.ACTIVE)
        .scalar()
        or 0,
        resolved_incidents=db.query(func.count(Incident.id))
        .filter(Incident.status == IncidentStatus.RESOLVED)
        .scalar()
        or 0,
        admins=db.query(func.count(Profile.user_id))
        .filter(Profile.is_admin.is_(True))
        .scalar()
        or 0,
    )


@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_admin),
):
    sync_profile(db, user)
    profiles = db.query(Profile).order_by(Profile.updated_at.desc()).all()
    report_counts = dict(
        db.query(Report.user_id, func.count(Report.id))
        .filter(Report.user_id.is_not(None))
        .group_by(Report.user_id)
        .all()
    )
    confirmation_counts = dict(
        db.query(Confirmation.user_id, func.count(Confirmation.id))
        .filter(Confirmation.user_id.is_not(None))
        .group_by(Confirmation.user_id)
        .all()
    )
    return [
        _user_out(
            profile,
            report_counts.get(profile.user_id, 0),
            confirmation_counts.get(profile.user_id, 0),
        )
        for profile in profiles
    ]


@router.patch("/users/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: str,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_admin),
):
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.display_name is not None:
        profile.display_name = _clip(payload.display_name, 80)
    if payload.area is not None:
        profile.area = _clip(payload.area, 80)
    if payload.bio is not None:
        profile.bio = _clip(payload.bio, 280)
    if payload.is_admin is not None:
        if is_bootstrap_admin(profile.email) and not payload.is_admin:
            raise HTTPException(
                status_code=400, detail="Cannot remove the bootstrap admin"
            )
        profile.is_admin = payload.is_admin
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    report_count = (
        db.query(func.count(Report.id)).filter(Report.user_id == user_id).scalar() or 0
    )
    confirmation_count = (
        db.query(func.count(Confirmation.id))
        .filter(Confirmation.user_id == user_id)
        .scalar()
        or 0
    )
    return _user_out(profile, report_count, confirmation_count)


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require_admin),
):
    if user_id == actor.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    if is_bootstrap_admin(profile.email):
        raise HTTPException(status_code=400, detail="Cannot delete the bootstrap admin")

    reports = db.query(Report).filter(Report.user_id == user_id).all()
    incident_ids = {report.incident_id for report in reports if report.incident_id}
    db.query(Confirmation).filter(Confirmation.user_id == user_id).delete(
        synchronize_session=False
    )
    for report in reports:
        db.delete(report)
    db.flush()
    for incident_id in incident_ids:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if incident:
            recount_incident(db, incident)
    if profile.avatar_filename:
        path = AVATARS_DIR / profile.avatar_filename
        if path.exists():
            path.unlink()
    db.delete(profile)
    db.commit()
    return {"ok": True}


@router.get("/reports", response_model=list[AdminReportOut])
def list_reports(
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_admin),
):
    reports = (
        db.query(Report)
        .options(selectinload(Report.confirmations))
        .order_by(Report.created_at.desc())
        .limit(500)
        .all()
    )
    profiles = {
        profile.user_id: profile
        for profile in db.query(Profile).all()
    }
    return [_report_out(report, profiles.get(report.user_id or "")) for report in reports]


@router.patch("/reports/{report_id}", response_model=AdminReportOut)
def update_report(
    report_id: int,
    payload: ReportUpdate,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_admin),
):
    report = (
        db.query(Report)
        .options(selectinload(Report.confirmations))
        .filter(Report.id == report_id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if payload.latitude is not None and payload.longitude is not None:
        if not is_in_lebanon(payload.latitude, payload.longitude):
            raise HTTPException(status_code=400, detail="Location must be within Lebanon")
        report.latitude = payload.latitude
        report.longitude = payload.longitude
    elif payload.latitude is not None or payload.longitude is not None:
        raise HTTPException(status_code=400, detail="Provide both latitude and longitude")
    if payload.type is not None:
        report.type = payload.type
    if payload.area is not None:
        report.area = _clip(payload.area, 255)
    if payload.governorate is not None:
        report.governorate = _clip(payload.governorate, 80)
    if payload.district is not None:
        report.district = _clip(payload.district, 80)
    if payload.municipality is not None:
        report.municipality = _clip(payload.municipality, 120)
    if payload.description is not None:
        report.description = _clip(payload.description, 2000)
    db.commit()
    db.refresh(report)
    if report.incident_id:
        incident = db.query(Incident).filter(Incident.id == report.incident_id).first()
        if incident:
            recount_incident(db, incident)
    profile = (
        db.query(Profile).filter(Profile.user_id == report.user_id).first()
        if report.user_id
        else None
    )
    report = (
        db.query(Report)
        .options(selectinload(Report.confirmations))
        .filter(Report.id == report_id)
        .first()
    )
    return _report_out(report, profile)


@router.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_admin),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    incident_id = report.incident_id
    db.delete(report)
    db.flush()
    if incident_id:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if incident:
            recount_incident(db, incident)
    else:
        db.commit()
    return {"ok": True}


@router.get("/incidents", response_model=list[IncidentOut])
def list_incidents(
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_admin),
):
    return (
        db.query(Incident)
        .order_by(Incident.updated_at.desc())
        .limit(500)
        .all()
    )


@router.patch("/incidents/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: int,
    payload: IncidentAdminUpdate,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_admin),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if payload.latitude is not None and payload.longitude is not None:
        if not is_in_lebanon(payload.latitude, payload.longitude):
            raise HTTPException(status_code=400, detail="Location must be within Lebanon")
        incident.latitude = payload.latitude
        incident.longitude = payload.longitude
    if payload.type is not None:
        incident.type = payload.type
    if payload.area is not None:
        incident.area = _clip(payload.area, 255)
    if payload.status is not None:
        incident.status = payload.status
        if payload.status == IncidentStatus.RESOLVED:
            incident.resolved_at = incident.resolved_at or datetime.now(timezone.utc)
        else:
            incident.resolved_at = None
    if payload.confidence is not None:
        incident.confidence = payload.confidence
    db.commit()
    db.refresh(incident)
    return incident


@router.delete("/incidents/{incident_id}")
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_admin),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.query(Report).filter(Report.incident_id == incident.id).delete(
        synchronize_session=False
    )
    db.delete(incident)
    db.commit()
    return {"ok": True}
