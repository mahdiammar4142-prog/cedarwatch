from datetime import datetime, timedelta, timezone

from app.database import Base, SessionLocal, engine
from app.models import (
    Agent,
    AgentCheck,
    ConfidenceLevel,
    Confirmation,
    Incident,
    IncidentStatus,
    OutageType,
    Report,
)


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        db.query(Confirmation).delete()
        db.query(AgentCheck).delete()
        db.query(Report).delete()
        db.query(Agent).delete()
        db.query(Incident).delete()

        now = datetime.now(timezone.utc)
        beirut = Incident(
            type=OutageType.ELECTRICITY,
            latitude=33.8938,
            longitude=35.5018,
            area="Hamra, Beirut",
            confidence=ConfidenceLevel.LIKELY,
            report_count=4,
            confirmation_count=2,
            started_at=now,
        )
        verdun = Incident(
            type=OutageType.INTERNET,
            latitude=33.8886,
            longitude=35.4955,
            area="Verdun, Beirut",
            confidence=ConfidenceLevel.POSSIBLE,
            report_count=2,
            confirmation_count=1,
            agent_failure_count=2,
            started_at=now,
        )
        zahle = Incident(
            type=OutageType.WATER,
            latitude=33.8547,
            longitude=35.8623,
            area="Zahle",
            confidence=ConfidenceLevel.UNVERIFIED,
            report_count=1,
            confirmation_count=0,
            started_at=now,
        )
        tripoli_power = Incident(
            type=OutageType.ELECTRICITY,
            latitude=34.4363,
            longitude=35.8497,
            area="Tripoli",
            confidence=ConfidenceLevel.CONFIRMED,
            status=IncidentStatus.RESOLVED,
            report_count=6,
            confirmation_count=4,
            started_at=now - timedelta(days=3),
            resolved_at=now - timedelta(days=2, hours=14),
        )
        saida_net = Incident(
            type=OutageType.INTERNET,
            latitude=33.5571,
            longitude=35.3729,
            area="Saida",
            confidence=ConfidenceLevel.LIKELY,
            status=IncidentStatus.RESOLVED,
            report_count=3,
            confirmation_count=2,
            started_at=now - timedelta(days=8),
            resolved_at=now - timedelta(days=7, hours=19),
        )
        hamra_old = Incident(
            type=OutageType.ELECTRICITY,
            latitude=33.8938,
            longitude=35.5018,
            area="Hamra, Beirut",
            confidence=ConfidenceLevel.CONFIRMED,
            status=IncidentStatus.RESOLVED,
            report_count=5,
            confirmation_count=3,
            started_at=now - timedelta(days=1, hours=10),
            resolved_at=now - timedelta(hours=6),
        )
        db.add_all([beirut, verdun, zahle, tripoli_power, saida_net, hamra_old])
        db.flush()

        db.add_all(
            [
                Report(
                    type=OutageType.ELECTRICITY,
                    latitude=33.8938,
                    longitude=35.5018,
                    area="Hamra, Beirut",
                    description="Power cut since morning",
                    incident_id=beirut.id,
                ),
                Report(
                    type=OutageType.ELECTRICITY,
                    latitude=33.895,
                    longitude=35.503,
                    area="Hamra, Beirut",
                    incident_id=beirut.id,
                ),
            ]
        )
        db.commit()
        print("Seed data created.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
