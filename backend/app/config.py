from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────
    APP_NAME: str = "Elevra"
    DEBUG: bool = False
    API_V1_PREFIX: str = ""

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/careerai"

    # ── JWT ──────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production-use-a-secure-random-key-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── AI provider (Anthropic or Gemini — auto-detected from key prefix) ──────
    AI_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-3-5-sonnet-20241022"
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # ── Storage (Azure Blob Storage) ──────────────────────────
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_STORAGE_CONTAINER: str = "careerai-media"

    # ── CORS ─────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:5173"

    # ── JSearch (RapidAPI) ────────────────────────────────────
    RAPIDAPI_KEY: str = ""

    # ── IPQualityScore ────────────────────────────────────────
    IPQS_API_KEY: str = ""

    # ── Admin ─────────────────────────────────────────────────
    ADMIN_SECRET: str = "elevra-admin-secret-change-in-production"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
