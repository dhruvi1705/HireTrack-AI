import pytest
from app.services.rate_limiter import auth_rate_limiter


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Reset in-memory auth rate limit buckets before and after each test."""
    auth_rate_limiter.reset()
    yield
    auth_rate_limiter.reset()
