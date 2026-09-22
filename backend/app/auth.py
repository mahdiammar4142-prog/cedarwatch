from dataclasses import dataclass
from functools import lru_cache
import threading

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError, PyJWKClient

from app.config import settings

bearer = HTTPBearer(auto_error=False)
_jwks_lock = threading.Lock()


@dataclass
class CurrentUser:
    id: str
    email: str | None


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient | None:
    if not settings.supabase_url:
        return None
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(url, cache_keys=True, timeout=10)


def _decode_token(token: str) -> dict:
    jwks = _jwks_client()
    if jwks is not None:
        try:
            with _jwks_lock:
                signing_key = jwks.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience="authenticated",
            )
        except (InvalidTokenError, TimeoutError, OSError, Exception):
            pass

    if settings.supabase_jwt_secret and not settings.supabase_jwt_secret.startswith(
        "sb_secret_"
    ):
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )

    raise InvalidTokenError("Could not verify Supabase token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> CurrentUser:
    user = get_optional_user(credentials)
    if user is None:
        if credentials is None:
            if not settings.supabase_url and not settings.supabase_jwt_secret:
                raise HTTPException(
                    status_code=503,
                    detail="Supabase auth is not configured. Set SUPABASE_URL.",
                )
            raise HTTPException(status_code=401, detail="Sign in required")
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> CurrentUser | None:
    if credentials is None:
        return None
    if not settings.supabase_url and not settings.supabase_jwt_secret:
        return None
    try:
        payload = _decode_token(credentials.credentials)
    except Exception:
        return None
    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        return None
    email = payload.get("email")
    return CurrentUser(id=user_id, email=email if isinstance(email, str) else None)
