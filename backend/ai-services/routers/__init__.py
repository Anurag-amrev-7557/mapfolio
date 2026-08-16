"""
API Routers Package
FastAPI routers for AI service endpoints
"""

from .theme_router import router as theme_router
from .location_router import router as location_router

__all__ = ['theme_router', 'location_router']