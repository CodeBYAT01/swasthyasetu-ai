"""Authentication endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from ..schemas.user import UserOut
from ..security.authentication import create_access_token, get_current_user
from ..services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a health worker or doctor",
    responses={403: {"description": "Registration not allowed for this role"}, 409: {"description": "Email already in use"}},
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register_user(db, payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in with email and password",
    responses={401: {"description": "Invalid email or password"}},
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, payload)
    token, expires_in = create_access_token(user)
    return TokenResponse(access_token=token, expires_in=expires_in, user=user)


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get the currently authenticated user",
)
def me(current_user=Depends(get_current_user)):
    return current_user
