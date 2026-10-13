import pytest
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.database import Settings, normalize_database_url
from app.main import app


def test_normalize_database_url_postgres_scheme():
    url = "postgres://user:password@ep-test-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
    expected = "postgresql+psycopg2://user:password@ep-test-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
    assert normalize_database_url(url) == expected


def test_normalize_database_url_postgresql_scheme():
    url = "postgresql://user:password@ep-test-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
    expected = "postgresql+psycopg2://user:password@ep-test-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
    assert normalize_database_url(url) == expected


def test_normalize_database_url_already_normalized():
    url = "postgresql+psycopg2://user:password@ep-test-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
    assert normalize_database_url(url) == url


def test_normalize_database_url_whitespace_and_other_dialects():
    raw_with_spaces = "  postgresql://user:password@ep-test.neon.tech/neondb?sslmode=require  "
    expected = "postgresql+psycopg2://user:password@ep-test.neon.tech/neondb?sslmode=require"
    assert normalize_database_url(raw_with_spaces) == expected

    sqlite_url = "sqlite:///./test.db"
    assert normalize_database_url(sqlite_url) == sqlite_url


def test_settings_normalizes_database_url():
    neon_url = "postgres://neon_user:neon_pass@ep-cool-fog.neon.tech/neondb?sslmode=require"
    custom_settings = Settings(
        database_url=neon_url,
        jwt_secret_key="test-secret-key-1234567890123456",
    )
    assert custom_settings.database_url.startswith("postgresql+psycopg2://")


def test_settings_jwt_secret_key_is_required():
    # Attempting to instantiate Settings without jwt_secret_key when ignoring .env
    # must raise ValidationError because jwt_secret_key has no default
    with pytest.raises(ValidationError):
        Settings(_env_file=None, database_url="postgresql://usr:pass@host/db")


def test_settings_cors_origins_defaults():
    s = Settings(
        database_url="postgresql+psycopg2://u:p@host/db",
        jwt_secret_key="test-secret-key-1234567890123456",
    )
    assert "http://localhost:5173" in s.cors_origins_list
    assert "http://127.0.0.1:5173" in s.cors_origins_list


def test_settings_cors_origins_custom_comma_separated():
    s = Settings(
        database_url="postgresql+psycopg2://u:p@host/db",
        jwt_secret_key="test-secret-key-1234567890123456",
        cors_origins="https://hiretrack.onrender.com, https://hiretrack.vercel.app,  ",
    )
    assert s.cors_origins_list == [
        "https://hiretrack.onrender.com",
        "https://hiretrack.vercel.app",
    ]


def test_settings_cors_origins_json_list():
    s = Settings(
        database_url="postgresql+psycopg2://u:p@host/db",
        jwt_secret_key="test-secret-key-1234567890123456",
        cors_origins='["https://hiretrack.onrender.com", "https://hiretrack.vercel.app"]',
    )
    assert s.cors_origins_list == [
        "https://hiretrack.onrender.com",
        "https://hiretrack.vercel.app",
    ]


def test_cors_middleware_with_main_app():
    client = TestClient(app)

    # Allowed localhost origin
    res = client.get("/", headers={"Origin": "http://localhost:5173"})
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert res.headers.get("access-control-allow-credentials") == "true"

    # Preflight OPTIONS check for allowed origin
    opt = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert opt.status_code == 200
    assert opt.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # Disallowed origin
    res_disallowed = client.get("/", headers={"Origin": "https://unauthorized-attacker.example.com"})
    assert res_disallowed.status_code == 200
    assert res_disallowed.headers.get("access-control-allow-origin") is None


def test_cors_middleware_with_production_origin():
    # Verify that when configured with production origins, the middleware allows them
    test_app = FastAPI()
    prod_origins = ["https://hiretrack.onrender.com", "https://hiretrack.vercel.app"]
    test_app.add_middleware(
        CORSMiddleware,
        allow_origins=prod_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @test_app.get("/ping")
    def ping():
        return {"ping": "pong"}

    client = TestClient(test_app)

    res_prod = client.get("/ping", headers={"Origin": "https://hiretrack.onrender.com"})
    assert res_prod.status_code == 200
    assert res_prod.headers.get("access-control-allow-origin") == "https://hiretrack.onrender.com"

    res_local = client.get("/ping", headers={"Origin": "http://localhost:5173"})
    assert res_local.status_code == 200
    assert res_local.headers.get("access-control-allow-origin") is None
