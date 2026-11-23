"""Password hashing, JWT creation/verification and current-user dependency.

Argon2id is used for password hashing (a maintained, modern KDF).
"""

from __future__ import annotations

import secrets
import uuid
from datetime import timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db, utcnow
from ..models.user import User

_password_hasher = PasswordHasher()
_bearer = HTTPBearer(auto_error=True, description="JWT access token")
_temporary_secret: str | None = None


def get_secret_key() -> str:
    """Use the configured secret, or a random per-process secret for local demos."""
    global _temporary_secret
    if settings.secret_key:
        return settings.secret_key
    if _temporary_secret is None:
        _temporary_secret = secrets.token_urlsafe(48)
    return _temporary_secret


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return _password_hasher.verify(hashed_password, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def create_access_token(user: User) -> tuple[str, int]:
    expires_in = settings.access_token_expire_minutes * 60
    now = utcnow()
    payload = {
        "sub": str(user.id),
        "role": user.role.value,
        "facility_id": str(user.facility_id) if user.facility_id else None,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
        "jti": secrets.token_hex(8),
    }
    return jwt.encode(payload, get_secret_key(), algorithm=settings.algorithm), expires_in


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            get_secret_key(),
            algorithms=[settings.algorithm],
            options={"require": ["sub", "exp"]},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(credentials.credentials)
    try:
        user_id = uuid.UUID(str(payload["sub"]))
    except (ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid token subject")

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User account is inactive or missing")
    return user
