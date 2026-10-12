import uuid
from fastapi import status
from fastapi.testclient import TestClient

from app.main import app
from app.services.rate_limiter import auth_rate_limiter, get_client_ip

client = TestClient(app)


def test_normal_login_and_registration_allowed():
    """Verify standard registration and login function normally under the rate limit."""
    auth_rate_limiter.reset()
    uid = uuid.uuid4().hex[:8]
    email = f"ratelimit_normal_{uid}@example.com"
    pwd = "StrongPassword123!"

    reg_res = client.post(
        "/api/auth/register",
        json={"full_name": "Normal User", "email": email, "password": pwd},
    )
    assert reg_res.status_code == status.HTTP_201_CREATED

    login_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": pwd},
    )
    assert login_res.status_code == status.HTTP_200_OK
    assert "access_token" in login_res.json()


def test_login_rate_limiting_exceeded_returns_429():
    """Verify that exceeding the login threshold returns 429 with Retry-After."""
    auth_rate_limiter.reset()
    email = f"bruteforce_{uuid.uuid4().hex[:8]}@example.com"

    # Send 10 failed login attempts (allowed by rate limiter)
    for _ in range(10):
        res = client.post(
            "/api/auth/login",
            json={"email": email, "password": "WrongPassword!"},
        )
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    # The 11th attempt must be throttled with HTTP 429
    throttled = client.post(
        "/api/auth/login",
        json={"email": email, "password": "WrongPassword!"},
    )
    assert throttled.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Retry-After" in throttled.headers
    assert int(throttled.headers["Retry-After"]) > 0
    assert "Too many requests" in throttled.json()["detail"]


def test_register_rate_limiting_exceeded_returns_429():
    """Verify that rapid registration attempts are throttled with 429."""
    auth_rate_limiter.reset()

    # Send 10 registration requests
    for i in range(10):
        uid = uuid.uuid4().hex[:6]
        res = client.post(
            "/api/auth/register",
            json={
                "full_name": f"User {i}",
                "email": f"reg_{uid}_{i}@example.com",
                "password": "Password123!",
            },
        )
        assert res.status_code == status.HTTP_201_CREATED

    # 11th registration attempt should trigger 429
    throttled = client.post(
        "/api/auth/register",
        json={
            "full_name": "Blocked User",
            "email": "blocked@example.com",
            "password": "Password123!",
        },
    )
    assert throttled.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Retry-After" in throttled.headers
    assert "Too many requests" in throttled.json()["detail"]


def test_rate_limiter_reset():
    """Verify that resetting the rate limiter clears previous throttles."""
    auth_rate_limiter.reset()
    email = "reset_test@example.com"

    # Fill up 10 attempts
    for _ in range(10):
        client.post("/api/auth/login", json={"email": email, "password": "bad"})

    throttled = client.post("/api/auth/login", json={"email": email, "password": "bad"})
    assert throttled.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    # Reset limiter
    auth_rate_limiter.reset()

    # Next attempt should be allowed through to auth validation (returns 401, not 429)
    retry_res = client.post("/api/auth/login", json={"email": email, "password": "bad"})
    assert retry_res.status_code == status.HTTP_401_UNAUTHORIZED


def test_spoofed_x_forwarded_for_not_trusted_by_default():
    """Ensure arbitrary X-Forwarded-For headers are not trusted without proxy configuration."""
    class DummyClient:
        host = "203.0.113.195"

    class DummyRequest:
        client = DummyClient()
        headers = {"x-forwarded-for": "198.51.100.1, 10.0.0.1"}

    # Untrusted: should return the actual client host, ignoring spoofed header
    ip = get_client_ip(DummyRequest(), trusted_proxies=None)
    assert ip == "203.0.113.195"

    # Trusted proxy configured: should extract leftmost client hop
    trusted_ip = get_client_ip(DummyRequest(), trusted_proxies=["203.0.113.195"])
    assert trusted_ip == "198.51.100.1"
