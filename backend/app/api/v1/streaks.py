"""
Streaks API Router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from typing import List
from uuid import UUID

from app.core.database import SupabaseClient, get_supabase
from app.core.security import get_current_user
from app.schemas.streak import StreakResponse, StreakSummary
from app.services.streak_calculator import StreakCalculator

router = APIRouter()

@router.get("/habit/{habit_id}", response_model=StreakSummary)
async def get_habit_streaks(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get all streaks for a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify habit exists
    habit_response = supabase.table("habits") \
        .select("id, freq_num, freq_den, weekday_schedule") \
        .eq("id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not habit_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    habit = habit_response.data
    
    # Calculate streaks
    streak_calc = StreakCalculator(supabase)
    streaks = streak_calc.calculate_streaks(
        habit_id,
        UUID(current_user["id"]),
        habit["freq_num"],
        habit["freq_den"],
        habit["weekday_schedule"]
    )
    
    # Get current and best streak
    current_streak = streak_calc.get_current_streak(
        habit_id,
        UUID(current_user["id"]),
        habit["freq_num"],
        habit["freq_den"],
        habit["weekday_schedule"]
    )
    
    best_streak = streak_calc.get_best_streak(
        habit_id,
        UUID(current_user["id"]),
        habit["freq_num"],
        habit["freq_den"],
        habit["weekday_schedule"]
    )
    
    # Convert to response format
    streak_responses = [
        {
            "id": None,  # Not stored in DB yet
            "habit_id": habit_id,
            "user_id": UUID(current_user["id"]),
            "start_date": s["start_date"],
            "end_date": s["end_date"],
            "length": s["length"],
            "created_at": None,
            "updated_at": None
        }
        for s in streaks
    ]
    
    return {
        "habit_id": habit_id,
        "current_streak": current_streak,
        "best_streak": best_streak,
        "total_streaks": len(streaks),
        "streaks": streak_responses
    }

@router.post("/habit/{habit_id}/recalculate", response_model=StreakSummary)
async def recalculate_streaks(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Recalculate and save streaks for a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify habit exists
    habit_response = supabase.table("habits") \
        .select("id, freq_num, freq_den, weekday_schedule") \
        .eq("id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not habit_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    habit = habit_response.data
    
    # Calculate and save streaks
    streak_calc = StreakCalculator(supabase)
    streaks = streak_calc.calculate_streaks(
        habit_id,
        UUID(current_user["id"]),
        habit["freq_num"],
        habit["freq_den"],
        habit["weekday_schedule"]
    )
    
    await streak_calc.save_streaks(habit_id, UUID(current_user["id"]), streaks)
    
    # Return summary
    return await get_habit_streaks(habit_id, current_user, supabase)
