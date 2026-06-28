import base64
from functools import lru_cache

import jwt
from fastapi import Header, HTTPException
from jwt import PyJWKClient

from app.config import settings


@lru_cache
def _issuer() -> str:
    if not settings.CLERK_PUBLISHABLE_KEY:
        raise RuntimeError("CLERK_PUBLISHABLE_KEY is not set in backend/.env")
    # A Clerk publishable key is "pk_test_<base64>" / "pk_live_<base64>", where the base64
    # part decodes to "<frontend-api-domain>$" — that domain is also the token issuer and
    # JWKS host, so no separate Clerk API call is needed to discover it.
    encoded = settings.CLERK_PUBLISHABLE_KEY.split("_", 2)[2]
    padded = encoded + "=" * (-len(encoded) % 4)
    domain = base64.b64decode(padded).decode().rstrip("$")
    return f"https://{domain}"


@lru_cache
def _jwks_client() -> PyJWKClient:
    return PyJWKClient(f"{_issuer()}/.well-known/jwks.json")


def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ")
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=_issuer(),
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired session token") from exc
    return payload["sub"]
