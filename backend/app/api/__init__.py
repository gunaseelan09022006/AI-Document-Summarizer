from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.action_items import router as action_items_router
from app.api.compare import router as compare_router
from app.api.stats import router as stats_router

__all__ = [
    "auth_router",
    "documents_router",
    "action_items_router",
    "compare_router",
    "stats_router"
]

