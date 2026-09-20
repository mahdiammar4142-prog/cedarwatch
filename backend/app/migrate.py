from sqlalchemy import text

from app.database import engine


def ensure_auth_columns() -> None:
    statements = [
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)",
        "ALTER TABLE confirmations ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)",
        "CREATE INDEX IF NOT EXISTS ix_reports_user_id ON reports (user_id)",
        "CREATE INDEX IF NOT EXISTS ix_confirmations_user_id ON confirmations (user_id)",
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_confirmations_report_user
        ON confirmations (report_id, user_id)
        WHERE user_id IS NOT NULL
        """,
    ]
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
