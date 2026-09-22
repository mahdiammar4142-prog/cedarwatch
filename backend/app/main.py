from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.migrate import ensure_auth_columns
from app.models import Agent, AgentCheck, Confirmation, Incident, Profile, Report  # noqa: F401
from app.routers import admin, agent, history, incidents, profiles, reports, stats
from app.storage import UPLOADS_DIR

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
app.include_router(profiles.router)
app.include_router(admin.router)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}
