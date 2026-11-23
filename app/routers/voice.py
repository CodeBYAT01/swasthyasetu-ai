"""Voice transcription endpoint (mock provider for the hackathon demo)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from ..models.consultation import ConsultationLanguage
from ..security.permissions import get_current_worker_or_admin
from ..services.voice_service import (
    SUPPORTED_LANGUAGES,
    TranscriptionResponse,
    get_speech_service,
)

router = APIRouter(prefix="/voice", tags=["Voice & Multilingual"])

MAX_AUDIO_BYTES = 10 * 1024 * 1024


@router.post(
    "/transcribe",
    response_model=TranscriptionResponse,
    summary="Transcribe voice input (DEMO MOCK - not real speech recognition)",
    description=(
        "Accepts an audio file and a language selection. The audio bytes are read "
        "but never stored. The returned transcript must be reviewed and confirmed "
        "by the health worker before it is saved in a consultation."
    ),
    responses={413: {"description": "Audio file too large"}, 422: {"description": "Unsupported language"}},
)
async def transcribe(
    audio: UploadFile = File(..., description="Audio recording (not stored)"),
    language: str = Form(..., description="Kannada, Hindi or English"),
    user=Depends(get_current_worker_or_admin),
):
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"language must be one of: {', '.join(SUPPORTED_LANGUAGES)}",
        )
    audio_bytes = await audio.read(MAX_AUDIO_BYTES + 1)
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds 10 MB limit")

    service = get_speech_service()
    result = service.transcribe(audio_bytes, language, audio.filename)
    return TranscriptionResponse(**result.__dict__)
