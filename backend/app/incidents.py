from sqlalchemy import func
from sqlalchemy.orm import Session

from app.confidence import calculate_confidence
from app.geo import CLUSTER_RADIUS_KM, distance_km
from app.models import (
    ConfidenceLevel,
    Confirmation,
    Incident,
    IncidentStatus,
    OutageType,
    Report,
)


def find_nearby_incident(
    db: Session, outage_type: OutageType, latitude: float, longitude: float
) -> Incident | None:
    active = (
        db.query(Incident)
        .filter(Incident.type == outage_type, Incident.status == IncidentStatus.ACTIVE)
        .all()
    )
    for incident in active:
        if (
            distance_km(incident.latitude, incident.longitude, latitude, longitude)
            <= CLUSTER_RADIUS_KM
        ):
            return incident
    return None


def _centroid(points: list[tuple[float, float]]) -> tuple[float, float]:
    lat = sum(p[0] for p in points) / len(points)
    lng = sum(p[1] for p in points) / len(points)
    return lat, lng


def _confirmation_count(db: Session, incident: Incident) -> int:
    return (
        db.query(func.count(Confirmation.id))
        .join(Report, Confirmation.report_id == Report.id)
        .filter(Report.incident_id == incident.id)
        .scalar()
        or 0
    )


def attach_report_to_incident(db: Session, report: Report, incident: Incident) -> Incident:
    report.incident_id = incident.id
    db.flush()

    confirmation_count = _confirmation_count(db, incident)
    report_count = incident.report_count + 1
    incident.report_count = report_count
    incident.confirmation_count = confirmation_count
    incident.confidence = calculate_confidence(
        report_count, confirmation_count, incident.agent_failure_count
    )
    incident.area = incident.area or report.area
    points = [(r.latitude, r.longitude) for r in incident.reports] + [
        (report.latitude, report.longitude)
    ]
    incident.latitude, incident.longitude = _centroid(points)
    db.commit()
    db.refresh(incident)
    return incident


def create_incident_from_report(db: Session, report: Report) -> Incident:
    incident = Incident(
        type=report.type,
        latitude=report.latitude,
        longitude=report.longitude,
        area=report.area,
        report_count=1,
        confirmation_count=0,
        confidence=ConfidenceLevel.UNVERIFIED,
    )
    db.add(incident)
    db.flush()
    report.incident_id = incident.id
    db.commit()
    db.refresh(incident)
    return incident


def process_new_report(db: Session, report: Report) -> Incident:
    nearby = find_nearby_incident(db, report.type, report.latitude, report.longitude)
    if nearby:
        return attach_report_to_incident(db, report, nearby)
    return create_incident_from_report(db, report)


def refresh_incident_confidence(db: Session, incident: Incident) -> Incident:
    confirmation_count = _confirmation_count(db, incident)
    incident.confirmation_count = confirmation_count
    incident.confidence = calculate_confidence(
        incident.report_count, confirmation_count, incident.agent_failure_count
    )
    db.commit()
    db.refresh(incident)
    return incident


def process_agent_failures(
    db: Session,
    outage_type: OutageType,
    latitude: float,
    longitude: float,
    area: str | None,
    failure_count: int,
) -> Incident:
    nearby = find_nearby_incident(db, outage_type, latitude, longitude)
    if nearby:
        nearby.agent_failure_count = max(nearby.agent_failure_count, failure_count)
        nearby.confidence = calculate_confidence(
            nearby.report_count, nearby.confirmation_count, nearby.agent_failure_count
        )
        db.commit()
        db.refresh(nearby)
        return nearby

    incident = Incident(
        type=outage_type,
        latitude=latitude,
        longitude=longitude,
        area=area,
        report_count=0,
        confirmation_count=0,
        agent_failure_count=failure_count,
        confidence=calculate_confidence(0, 0, failure_count),
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident
