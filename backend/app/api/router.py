"""
Main API Router
"""
from fastapi import APIRouter
from app.api.v1 import habits, repetitions, streaks, scores, statistics, export_data

api_router = APIRouter()

# Include v1 routers
api_router.include_router(
    habits.router,
    prefix="/v1/habits",
    tags=["habits"]
)

api_router.include_router(
    repetitions.router,
    prefix="/v1/repetitions",
    tags=["repetitions"]
)

api_router.include_router(
    streaks.router,
    prefix="/v1/streaks",
    tags=["streaks"]
)

api_router.include_router(
    scores.router,
    prefix="/v1/scores",
    tags=["scores"]
)

api_router.include_router(
    statistics.router,
    prefix="/v1/statistics",
    tags=["statistics"]
)

api_router.include_router(
    export_data.router,
    prefix="/v1/export",
    tags=["export"]
)
