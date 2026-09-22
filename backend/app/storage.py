from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UPLOADS_DIR = ROOT / "uploads"
AVATARS_DIR = UPLOADS_DIR / "avatars"

AVATARS_DIR.mkdir(parents=True, exist_ok=True)
