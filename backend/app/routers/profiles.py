from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.admin_deps import profile_is_admin, sync_profile
from app.auth import CurrentUser, get_current_user
from app.database import get_db
from app.models import Profile
from app.schemas import MeOut, MeUpdate
from app.storage import AVATARS_DIR

router = APIRouter(prefix="/api/me", tags=["profile"])

MAX_AVATAR_BYTES = 2 * 1024 * 1024
ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _clip(value: str | None, limit: int) -> str | None:
    if value is None:
        return None
    text = value.strip()
    if not text:
        return None
    return text[:limit]


def _avatar_url(profile: Profile) -> str | None:
    if not profile.avatar_filename:
        return None
    stamp = int(profile.updated_at.timestamp()) if profile.updated_at else 0
    return f"/uploads/avatars/{profile.avatar_filename}?v={stamp}"


def _to_me(user: CurrentUser, profile: Profile) -> MeOut:
    return MeOut(
        id=user.id,
        email=user.email,
        display_name=profile.display_name,
        area=profile.area,
        bio=profile.bio,
        avatar_url=_avatar_url(profile),
        is_admin=profile_is_admin(user, profile),
    )


def _get_or_create_profile(db: Session, user: CurrentUser) -> Profile:
    return sync_profile(db, user)


def _detect_extension(content_type: str | None, data: bytes) -> str:
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    if content_type in ALLOWED_TYPES:
        return ALLOWED_TYPES[content_type]
    raise HTTPException(status_code=400, detail="Photo must be a JPEG, PNG, or WebP")


@router.get("", response_model=MeOut)
def get_me(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    profile = _get_or_create_profile(db, user)
    return _to_me(user, profile)


@router.patch("", response_model=MeOut)
def update_me(
    payload: MeUpdate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    profile = _get_or_create_profile(db, user)
    if payload.display_name is not None:
        profile.display_name = _clip(payload.display_name, 80)
    if payload.area is not None:
        profile.area = _clip(payload.area, 80)
    if payload.bio is not None:
        profile.bio = _clip(payload.bio, 280)
    db.commit()
    db.refresh(profile)
    return _to_me(user, profile)


@router.post("/avatar", response_model=MeOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty photo")
    if len(data) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=400, detail="Photo must be 2 MB or smaller")

    extension = _detect_extension(file.content_type, data)
    safe_id = "".join(ch for ch in user.id if ch.isalnum() or ch in "-_")
    if not safe_id:
        raise HTTPException(status_code=400, detail="Invalid user")

    filename = f"{safe_id}{extension}"
    profile = _get_or_create_profile(db, user)

    for old in AVATARS_DIR.glob(f"{safe_id}.*"):
        if old.name != filename:
            old.unlink(missing_ok=True)

    Path(AVATARS_DIR / filename).write_bytes(data)
    profile.avatar_filename = filename
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return _to_me(user, profile)
