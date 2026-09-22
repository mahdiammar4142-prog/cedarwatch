from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.auth import CurrentUser, get_current_user
from app.database import get_db
from app.geo import is_in_lebanon
from app.incidents import process_new_report, refresh_incident_confidence
from app.places import is_valid_place
from app.models import Confirmation, Incident, Report
from app.routers.incidents import to_incident_out
from app.schemas import ConfirmationOut, ReportCreate, ReportCreated, ReportOut

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("", response_model=list[ReportOut])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).limit(100).all()


@router.post("", response_model=ReportCreated, status_code=201)
def create_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    if not is_in_lebanon(payload.latitude, payload.longitude):
        raise HTTPException(status_code=400, detail="Location must be within Lebanon")
    if not is_valid_place(payload.governorate, payload.district):
        raise HTTPException(status_code=400, detail="Choose a valid governorate and district")

    report = Report(
        type=payload.type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        governorate=payload.governorate.strip(),
        district=payload.district.strip(),
        municipality=payload.municipality.strip() if payload.municipality else None,
        area=payload.area.strip() if payload.area else None,
        description=payload.description.strip() if payload.description else None,
        user_id=user.id,
    )
    db.add(report)
    db.flush()
    incident = process_new_report(db, report)
    db.refresh(report)
    incident = (
        db.query(Incident)
        .options(selectinload(Incident.reports))
        .filter(Incident.id == incident.id)
        .first()
    )
    return {"report": report, "incident": to_incident_out(incident, user)}


@router.post("/{report_id}/confirm", response_model=ConfirmationOut, status_code=201)
def confirm_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    already = (
        db.query(Confirmation)
        .filter(Confirmation.report_id == report.id, Confirmation.user_id == user.id)
        .first()
    )
    if already:
        raise HTTPException(status_code=409, detail="You already confirmed this report")

    confirmation = Confirmation(report_id=report.id, user_id=user.id)
    db.add(confirmation)
    db.flush()

    if report.incident:
        refresh_incident_confidence(db, report.incident)
    else:
        db.commit()

    db.refresh(confirmation)
    return confirmation
