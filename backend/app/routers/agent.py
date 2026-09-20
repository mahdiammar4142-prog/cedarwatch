from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.geo import CLUSTER_RADIUS_KM, distance_km, is_in_lebanon
from app.incidents import process_agent_failures
from app.models import Agent, AgentCheck, OutageType
from app.schemas import AgentCheckCreate, AgentCheckCreated

router = APIRouter(prefix="/api/agent", tags=["agent"])

AGENT_WINDOW_MINUTES = 10


@router.post("/check", response_model=AgentCheckCreated, status_code=201)
def submit_check(
    payload: AgentCheckCreate,
    db: Session = Depends(get_db),
    x_agent_key: str | None = Header(default=None),
):
    if not x_agent_key or x_agent_key != settings.agent_api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not is_in_lebanon(payload.latitude, payload.longitude):
        raise HTTPException(
            status_code=400, detail="Valid Lebanon coordinates are required"
        )

    area = payload.area.strip() if payload.area else None
    agent = db.query(Agent).filter(Agent.api_key == payload.agent_id).first()
    now = datetime.now(timezone.utc)

    if agent:
        agent.last_seen = now
        agent.latitude = payload.latitude
        agent.longitude = payload.longitude
        agent.area = area
    else:
        db.add(
            Agent(
                name=payload.agent_id,
                api_key=payload.agent_id,
                latitude=payload.latitude,
                longitude=payload.longitude,
                area=area,
            )
        )

    check = AgentCheck(
        agent_id=payload.agent_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        area=area,
        is_connected=payload.is_connected,
        latency_ms=payload.latency_ms,
        dns_ok=payload.dns_ok,
        packet_loss=payload.packet_loss,
    )
    db.add(check)
    db.flush()

    incident = None
    if not payload.is_connected:
        since = now - timedelta(minutes=AGENT_WINDOW_MINUTES)
        recent_failures = (
            db.query(AgentCheck)
            .filter(AgentCheck.is_connected.is_(False), AgentCheck.created_at >= since)
            .all()
        )
        nearby = [
            f
            for f in recent_failures
            if distance_km(f.latitude, f.longitude, payload.latitude, payload.longitude)
            <= CLUSTER_RADIUS_KM
        ]
        unique_agents = {f.agent_id for f in nearby}
        if len(unique_agents) >= 2:
            incident = process_agent_failures(
                db,
                OutageType.INTERNET,
                payload.latitude,
                payload.longitude,
                area,
                len(unique_agents),
            )

    db.commit()
    db.refresh(check)
    return {"check": check, "incident": incident}
