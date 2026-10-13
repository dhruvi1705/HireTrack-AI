import json
from pydantic import field_validator
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def normalize_database_url(url: str) -> str:
    """Normalize Postgres database URLs to use the psycopg2 dialect.

    Supports:
    - postgres://... -> postgresql+psycopg2://...
    - postgresql://... -> postgresql+psycopg2://...
    - postgresql+psycopg2://... -> remains unchanged
    - other dialects (e.g., sqlite://...) -> remains unchanged
    """
    cleaned = url.strip()
    if cleaned.startswith("postgres://"):
        return "postgresql+psycopg2://" + cleaned[len("postgres://"):]
    if cleaned.startswith("postgresql://") and not cleaned.startswith("postgresql+"):
        return "postgresql+psycopg2://" + cleaned[len("postgresql://"):]
    return cleaned


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.5-flash"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @field_validator("database_url", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            return normalize_database_url(v)
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        raw = self.cors_origins.strip()
        if raw.startswith("[") and raw.endswith("]"):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            except Exception:
                pass
        return [item.strip() for item in raw.split(",") if item.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.models import User, Company, Job, Application, Interview, FollowUp
