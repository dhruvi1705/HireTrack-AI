"""In-Memory Sliding Window Rate Limiter for Authentication Endpoints.

Multi-Worker / Distributed Architecture Note:
---------------------------------------------
This rate limiter maintains sliding request windows in-memory per worker process.
When running FastAPI across multiple Uvicorn worker processes (e.g. `uvicorn --workers 4`)
or horizontally scaled across container replicas, each worker tracks limits independently.
For clustered production deployments with heavy traffic, rate limiting should be centralized
via a distributed Redis key-value store or handled at the reverse-proxy layer (e.g., NGINX / Cloudflare).

Security & Privacy Guarantees:
------------------------------
1. Passwords, emails, tokens, and sensitive credentials are NEVER logged or stored.
2. IP addresses are extracted securely: arbitrary X-Forwarded-For headers are NOT blindly trusted
   unless the direct client IP matches an explicitly configured trusted proxy.
"""

import math
import threading
import time
from collections import defaultdict
from typing import Callable, Sequence
from fastapi import HTTPException, Request, status


class SlidingWindowRateLimiter:
    """Thread-safe, in-memory sliding window rate limiter."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(
        self,
        key: str,
        max_requests: int,
        window_seconds: int,
        now: float | None = None,
    ) -> tuple[bool, int]:
        """Check whether a request under `key` is permitted.

        Returns:
            (is_allowed: bool, retry_after_seconds: int)
        """
        current_time = time.time() if now is None else now
        cutoff = current_time - window_seconds

        with self._lock:
            timestamps = self._requests[key]
            # Prune expired timestamps
            pruned = [ts for ts in timestamps if ts > cutoff]
            self._requests[key] = pruned

            if len(pruned) >= max_requests:
                # Oldest timestamp in window determines when a slot opens up
                oldest = pruned[0]
                retry_after = max(1, math.ceil(oldest + window_seconds - current_time))
                return False, retry_after

            # Record this request
            self._requests[key].append(current_time)
            return True, 0

    def reset(self) -> None:
        """Clear all stored rate limit history. Useful for testing."""
        with self._lock:
            self._requests.clear()


# Global in-memory rate limiter instance for auth endpoints
auth_rate_limiter = SlidingWindowRateLimiter()


def get_client_ip(
    request: Request,
    trusted_proxies: Sequence[str] | None = None,
) -> str:
    """Safely extract client IP address without blindly trusting spoofable headers.

    If trusted_proxies is provided and the direct client host is in that list,
    the client IP is read from the leftmost entry in X-Forwarded-For.
    Otherwise, request.client.host is used directly to prevent header spoofing.
    """
    client_host = request.client.host if request.client else "127.0.0.1"

    if trusted_proxies and client_host in trusted_proxies:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Parse comma-separated IPs; take the initial client hop
            hops = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()]
            if hops:
                return hops[0]

    return client_host


def rate_limit(
    max_requests: int = 10,
    window_seconds: int = 60,
    trusted_proxies: Sequence[str] | None = None,
) -> Callable[[Request], None]:
    """FastAPI dependency factory enforcing rate limits per endpoint and client IP."""

    def dependency(request: Request) -> None:
        client_ip = get_client_ip(request, trusted_proxies=trusted_proxies)
        endpoint = request.url.path
        rate_key = f"{endpoint}:{client_ip}"

        allowed, retry_after = auth_rate_limiter.is_allowed(
            key=rate_key,
            max_requests=max_requests,
            window_seconds=window_seconds,
        )

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Please try again after {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

    return dependency
