"""
Statistics API Router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from uuid import UUID
from datetime import date, timedelta

from app.core.database import SupabaseClient, get_supabase
from app.core.security import get_current_user
from app.schemas.statistics import HabitStatistics, OverviewStatistics
from app.services.streak_calculator import StreakCalculator

router = APIRouter()

@router.get("/overview", response_model=OverviewStatistics)
async def get_overview_statistics(
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get overview statistics for all user's habits"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    user_id = current_user["id"]
    
    # Get total habits
    habits_response = supabase.table("habits") \
        .select("id, archived", count="exact") \
        .eq("user_id", user_id) \
        .execute()
    
    total_habits = habits_response.count or 0
    active_habits = len([h for h in habits_response.data if not h["archived"]])
    archived_habits = total_habits - active_habits
    
    # Get total repetitions
    rep_response = supabase.table("repetitions") \
        .select("id", count="exact") \
        .eq("user_id", user_id) \
        .execute()
    
    total_repetitions = rep_response.count or 0
    
    # Get today's repetitions
    today = date.today()
    today_rep_response = supabase.table("repetitions") \
        .select("habit_id") \
        .eq("user_id", user_id) \
        .eq("date", today.isoformat()) \
        .execute()
    
    total_repetitions_today = len(today_rep_response.data)
    habits_completed_today = len(set(r["habit_id"] for r in today_rep_response.data))
    
    # Get longest streak
    streaks_response = supabase.table("streaks") \
        .select("length") \
        .eq("user_id", user_id) \
        .order("length", desc=True) \
        .limit(1) \
        .execute()
    
    longest_streak = streaks_response.data[0]["length"] if streaks_response.data else 0
    
    return {
        "total_habits": total_habits,
        "active_habits": active_habits,
        "archived_habits": archived_habits,
        "total_repetitions": total_repetitions,
        "total_repetitions_today": total_repetitions_today,
        "habits_completed_today": habits_completed_today,
        "longest_streak": longest_streak,
        "average_completion_rate": 0.0  # TODO: Calculate
    }

@router.get("/habit/{habit_id}", response_model=HabitStatistics)
async def get_habit_statistics(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get detailed statistics for a specific habit"""
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
    
    # Get repetitions
    rep_response = supabase.table("repetitions") \
        .select("*") \
        .eq("habit_id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .execute()
    
    total_repetitions = len(rep_response.data)
    
    # Calculate average value for numerical habits
    average_value = None
    if habit["habit_type"] == "numerical" and rep_response.data:
        values = [r["value"] for r in rep_response.data if r["value"] > 0]
        average_value = sum(values) / len(values) if values else 0
    
    # Get last completion
    last_completion = None
    if rep_response.data:
        last_rep = max(rep_response.data, key=lambda x: x["date"])
        last_completion = date.fromisoformat(last_rep["date"])
    
    # Calculate streaks
    streak_calc = StreakCalculator(supabase)
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
    
    # Calculate completion rate (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    recent_reps = [
        r for r in rep_response.data
        if date.fromisoformat(r["date"]) >= thirty_days_ago
    ]
    
    # Expected completions in 30 days
    expected_completions = (30 * habit["freq_num"]) / habit["freq_den"]
    completion_rate = (len(recent_reps) / expected_completions * 100) if expected_completions > 0 else 0
    completion_rate = min(completion_rate, 100.0)
    
    # Total days tracked
    if rep_response.data:
        first_date = min(date.fromisoformat(r["date"]) for r in rep_response.data)
        total_days_tracked = (date.today() - first_date).days + 1
    else:
        total_days_tracked = 0
    
    return {
        "habit_id": habit_id,
        "habit_name": habit["name"],
        "total_repetitions": total_repetitions,
        "completion_rate": completion_rate,
        "current_streak": current_streak,
        "best_streak": best_streak,
        "average_value": average_value,
        "last_completion": last_completion,
        "total_days_tracked": total_days_tracked
    }
