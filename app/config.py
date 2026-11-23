"""Application settings loaded from environment variables / .env.

Only non-secret defaults live in this file. If SECRET_KEY is not provided the
application generates a temporary random key at startup (tokens become invalid
after a restart), which is safe for a local demo.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "SwasthyaSetu AI"
    environment: str = "development"

    # PostgreSQL is the target database. SQLite is supported for fast local tests.
    database_url: str = (
        "postgresql+pg8000://postgres:postgres@localhost:5432/swasthyasetu"
    )
    auto_create_tables: bool = True

    secret_key: str | None = None
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    voice_provider: str = "mock"
    triage_rule_version: str = "demo-v1"

    # Illustrative demo thresholds. These are NOT medically validated.
    triage_spo2_emergency: float = 90.0
    triage_systolic_low_emergency: float = 90.0
    triage_respiratory_high_emergency: float = 30.0
    triage_temperature_prompt: float = 39.0
    triage_pulse_high_prompt: float = 120.0
    triage_systolic_high_prompt: float = 180.0
    triage_diastolic_high_prompt: float = 120.0
    triage_required_vitals: str = (
        "temperature,pulse,systolic_bp,diastolic_bp,oxygen_saturation,respiratory_rate"
    )

    registration_open: bool = True
    allow_admin_registration: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
