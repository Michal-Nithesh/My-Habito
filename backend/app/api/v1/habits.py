"""
Habits API Router
CRUD operations for habits
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from typing import List
from uuid import UUID

from app.core.database import SupabaseClient, get_supabase
from app.core.security import get_current_user
from app.schemas.habit import HabitCreate, HabitUpdate, HabitResponse, HabitWithStats
from app.services.streak_calculator import StreakCalculator
from app.services.score_calculator import ScoreCalculator

router = APIRouter()

@router.get("/", response_model=List[HabitResponse])
async def list_habits(
    archived: bool = False,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get all habits for the current user"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    response = supabase.table("habits") \
        .select("*") \
        .eq("user_id", current_user["id"]) \
        .eq("archived", archived) \
        .order("position", desc=False) \
        .execute()
    
    return response.data

@router.get("/{habit_id}", response_model=HabitResponse)
async def get_habit(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get a specific habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    response = supabase.table("habits") \
        .select("*") \
        .eq("id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    return response.data

@router.get("/{habit_id}/with-stats", response_model=HabitWithStats)
async def get_habit_with_stats(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get a habit with statistics"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Get habit
    habit_response = supabase.table("habits") \
        .select("*") \
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
    
    # Calculate statistics
    streak_calc = StreakCalculator(supabase)
    score_calc = ScoreCalculator(supabase)
    
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
    
    # Get repetition count
    rep_response = supabase.table("repetitions") \
        .select("id", count="exact") \
        .eq("habit_id", str(habit_id)) \
        .execute()
    
    total_repetitions = rep_response.count or 0
    
    # Get last completion
    last_rep = supabase.table("repetitions") \
        .select("date") \
        .eq("habit_id", str(habit_id)) \
        .order("date", desc=True) \
        .limit(1) \
        .execute()
    
    last_completion = last_rep.data[0]["date"] if last_rep.data else None
    
    return {
        **habit,
        "total_repetitions": total_repetitions,
        "current_streak": current_streak,
        "best_streak": best_streak,
        "completion_rate": 0.0,  # TODO: Calculate
        "last_completion": last_completion
    }

@router.post("/", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    habit: HabitCreate,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Create a new habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    habit_data = habit.dict()
    habit_data["user_id"] = current_user["id"]
    
    response = supabase.table("habits") \
        .insert(habit_data) \
        .execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create habit"
        )
    
    return response.data[0]

@router.put("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: UUID,
    habit_update: HabitUpdate,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Update a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify ownership
    existing = supabase.table("habits") \
        .select("id") \
        .eq("id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    # Update only provided fields
    update_data = habit_update.dict(exclude_unset=True)
    
    response = supabase.table("habits") \
        .update(update_data) \
        .eq("id", str(habit_id)) \
        .execute()
    
    return response.data[0]

@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Delete a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify ownership
    existing = supabase.table("habits") \
        .select("id") \
        .eq("id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    supabase.table("habits") \
        .delete() \
        .eq("id", str(habit_id)) \
        .execute()
    
    return None

@router.post("/{habit_id}/archive", response_model=HabitResponse)
async def archive_habit(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Archive a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    response = supabase.table("habits") \
        .update({"archived": True}) \
        .eq("id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    return response.data[0]

@router.post("/{habit_id}/unarchive", response_model=HabitResponse)
async def unarchive_habit(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Unarchive a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    response = supabase.table("habits") \
        .update({"archived": False}) \
        .eq("id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    return response.data[0]
