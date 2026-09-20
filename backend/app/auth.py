from dataclasses import dataclass
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError, PyJWKClient

from app.config import settings

bearer = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    id: str
    email: str | None


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient | None:
    if not settings.supabase_url:
        return None
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(url, cache_keys=True)


def _decode_token(token: str) -> dict:
    jwks = _jwks_client()
    if jwks is not None:
        try:
            signing_key = jwks.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience="authenticated",
            )
        except InvalidTokenError:
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
    if not settings.supabase_url and not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=503,
            detail="Supabase auth is not configured. Set SUPABASE_URL.",
        )
    if credentials is None:
        raise HTTPException(status_code=401, detail="Sign in required")

    try:
        payload = _decode_token(credentials.credentials)
    except InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired session") from exc

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload.get("email")
    return CurrentUser(id=user_id, email=email if isinstance(email, str) else None)
