from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import CurrentUser, get_current_user
from app.config import settings
from app.database import get_db
from app.models import Profile


def bootstrap_admin_emails() -> set[str]:
    return {
        item.strip().lower()
        for item in settings.admin_emails.split(",")
        if item.strip()
    }


def is_bootstrap_admin(email: str | None) -> bool:
    return bool(email and email.lower() in bootstrap_admin_emails())


def sync_profile(db: Session, user: CurrentUser) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if profile is None:
        profile = Profile(user_id=user.id)
        db.add(profile)
        db.flush()
    if user.email:
        profile.email = user.email
    if is_bootstrap_admin(user.email):
        profile.is_admin = True
    db.commit()
    db.refresh(profile)
    return profile


def profile_is_admin(user: CurrentUser, profile: Profile) -> bool:
    return is_bootstrap_admin(user.email) or bool(profile.is_admin)


def require_admin(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    profile = sync_profile(db, user)
    if not profile_is_admin(user, profile):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
