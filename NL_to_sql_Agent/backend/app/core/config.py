from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "NL to SQL Backend"

    # CORS（Phase 1 简化为全开放，后续可收紧）
    CORS_ALLOW_ORIGINS: list[str] = ["*"]

    # Placeholder for future Qwen3/Bailian config
    BAILIAN_API_KEY: str | None = None
    BAILIAN_ENDPOINT: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

