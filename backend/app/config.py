from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT / ".env"),
        extra="ignore",
    )

    database_url: str = (
        "postgresql+psycopg://cedarwatch:cedarwatch@localhost:5432/cedarwatch"
    )
    agent_api_key: str = "cedarwatch-dev-agent-key"
    cors_origins: str = "http://localhost:5173,https://localhost:5173,http://127.0.0.1:5173,https://127.0.0.1:5173"
    supabase_url: str = ""
    supabase_jwt_secret: str = ""
    admin_emails: str = "admin@gmail.com"


settings = Settings()
