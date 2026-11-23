"""Modular speech-to-text service.

The hackathon build uses a clearly labelled mock. Replace MockSpeechService with
an adapter for AI4Bharat IndicConformer or BHASHINI by implementing the same
`transcribe` method and setting VOICE_PROVIDER accordingly.
"""

from __future__ import annotations

from dataclasses import dataclass

from pydantic import BaseModel, Field

from ..config import settings
from ..models.consultation import ConsultationLanguage

SUPPORTED_LANGUAGES = tuple(lang.value for lang in ConsultationLanguage)


@dataclass(frozen=True)
class TranscriptionResult:
    language: str
    transcript: str
    status: str = "success"
    demo_mode: bool = True
    requires_confirmation: bool = True
    detected_language: str | None = None


class VoiceService:
    """Interface for real and mock transcription providers."""

    def transcribe(
        self, audio_bytes: bytes, language: str, filename: str | None = None
    ) -> TranscriptionResult:
        raise NotImplementedError


class MockSpeechService(VoiceService):
    """Deterministic demo transcription. It ignores the audio bytes entirely."""

    SAMPLE_TRANSCRIPTS = {
        "Kannada": "Patient reports fever and headache for two days",
        "Hindi": "Patient reports fever and headache for two days",
        "English": "Patient reports fever and headache for two days",
    }

    def transcribe(
        self, audio_bytes: bytes, language: str, filename: str | None = None
    ) -> TranscriptionResult:
        if language not in SUPPORTED_LANGUAGES:
            raise ValueError(f"Unsupported language: {language}")
        return TranscriptionResult(
            language=language,
            transcript=self.SAMPLE_TRANSCRIPTS[language],
            status="success",
            demo_mode=True,
            requires_confirmation=True,
            detected_language=language,
        )


def get_speech_service() -> VoiceService:
    if settings.voice_provider == "mock":
        return MockSpeechService()
    raise RuntimeError(
        f"Unknown VOICE_PROVIDER '{settings.voice_provider}'. "
        "Use 'mock' until a real speech provider adapter is configured."
    )


class TranscriptionResponse(BaseModel):
    language: str
    transcript: str
    status: str
    demo_mode: bool
    requires_confirmation: bool
    detected_language: str | None = None
    note: str = Field(
        default=(
            "DEMO TRANSCRIPTION - not real speech recognition. The health worker "
            "must review and confirm the text before it enters the clinical record."
        )
    )
