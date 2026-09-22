from dataclasses import dataclass
import json
import os
import threading
import urllib.error
import urllib.request

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError, PyJWK

from app.config import settings

bearer = HTTPBearer(auto_error=False)
_jwks_lock = threading.Lock()
_jwks_cache: dict | None = None


@dataclass
class CurrentUser:
    id: str
    email: str | None


def _supabase_base() -> str:
    url = (
        settings.supabase_url
        or os.environ.get("SUPABASE_URL")
        or os.environ.get("VITE_SUPABASE_URL")
        or ""
    ).strip().rstrip("/")
    if url.endswith("/auth/v1"):
        url = url[: -len("/auth/v1")]
    return url


def _load_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    base = _supabase_base()
    if not base:
        raise InvalidTokenError("Supabase URL is not configured")
    jwks_url = f"{base}/auth/v1/.well-known/jwks.json"
    headers = {"Accept": "application/json", "User-Agent": "cedarwatch-api"}
    anon = (
        os.environ.get("SUPABASE_ANON_KEY")
        or os.environ.get("VITE_SUPABASE_ANON_KEY")
        or ""
    ).strip()
    if anon:
        headers["apikey"] = anon
        headers["Authorization"] = f"Bearer {anon}"
    request = urllib.request.Request(jwks_url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise InvalidTokenError(f"JWKS HTTP {exc.code} for {jwks_url}") from exc
    if not isinstance(payload, dict) or not payload.get("keys"):
        raise InvalidTokenError("Supabase JWKS was empty")
    _jwks_cache = payload
    return payload


def warmup_jwks() -> str:
    try:
        with _jwks_lock:
            keys = _load_jwks().get("keys", [])
        return f"ok:{len(keys)}"
    except Exception as exc:
        return f"error:{exc}"


def _decode_token(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    with _jwks_lock:
        jwks = _load_jwks()
    jwk = next((item for item in jwks.get("keys", []) if item.get("kid") == kid), None)
    if jwk is None:
        raise InvalidTokenError("No matching Supabase signing key")
    key = PyJWK.from_dict(jwk).key
    try:
        return jwt.decode(
            token,
            key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            leeway=60,
        )
    except InvalidTokenError:
        return jwt.decode(
            token,
            key,
            algorithms=["ES256", "RS256"],
            options={"verify_aud": False},
            leeway=60,
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> CurrentUser:
    user = get_optional_user(credentials)
    if user is None:
        if credentials is None:
            if not _supabase_base() and not settings.supabase_jwt_secret:
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
    try:
        payload = _decode_token(credentials.credentials)
    except Exception:
        return None
    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        return None
    email = payload.get("email")
    return CurrentUser(id=user_id, email=email if isinstance(email, str) else None)
