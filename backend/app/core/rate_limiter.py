import time
from collections import defaultdict
from fastapi import HTTPException, status, Request
from app.core.config import settings

class InMemoryRateLimiter:
    """Simple sliding-window rate limiter for AI operations"""
    def __init__(self, requests_per_minute: int = 20):
        self.requests_per_minute = requests_per_minute
        self.client_requests = defaultdict(list)

    def is_rate_limited(self, identifier: str) -> bool:
        now = time.time()
        window_start = now - 60.0

        # Purge timestamps older than 60 seconds
        recent = [ts for ts in self.client_requests[identifier] if ts > window_start]
        self.client_requests[identifier] = recent

        if len(recent) >= self.requests_per_minute:
            return True

        self.client_requests[identifier].append(now)
        return False

ai_rate_limiter = InMemoryRateLimiter(requests_per_minute=settings.AI_RATE_LIMIT_PER_MINUTE)

def check_ai_rate_limit(request: Request, user_id: int = None):
    # Key by user_id if authenticated, otherwise by client IP
    key = f"user:{user_id}" if user_id else f"ip:{request.client.host if request.client else 'anonymous'}"
    if ai_rate_limiter.is_rate_limited(key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {settings.AI_RATE_LIMIT_PER_MINUTE} AI requests per minute allowed. Please try again shortly."
        )

