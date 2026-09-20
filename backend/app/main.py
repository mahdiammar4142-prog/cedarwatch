from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import CurrentUser, get_current_user
from app.config import settings
from app.database import Base, engine
from app.migrate import ensure_auth_columns
from app.models import Agent, AgentCheck, Confirmation, Incident, Report  # noqa: F401
from app.routers import agent, history, incidents, reports, stats
from app.schemas import MeOut

Base.metadata.create_all(bind=engine)
ensure_auth_columns()

app = FastAPI(
    title="CedarWatch API",
    description="Lebanon infrastructure outage monitoring API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports.router)
app.include_router(incidents.router)
app.include_router(stats.router)
app.include_router(history.router)
app.include_router(agent.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/me", response_model=MeOut)
def me(user: CurrentUser = Depends(get_current_user)):
    return MeOut(id=user.id, email=user.email)
