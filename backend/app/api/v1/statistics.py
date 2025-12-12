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
from app.schemas.statistics import (
    HabitStatistics, 
    OverviewStatistics, 
    DetailedHabitStatistics,
    CalendarHeatmapData,
    TrendData,
    WeeklyChartData,
    MonthlyChartData
)
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

@router.get("/habit/{habit_id}/detailed", response_model=DetailedHabitStatistics)
async def get_detailed_habit_statistics(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get detailed analytics for a specific habit with charts and trends"""
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
    
    # Get all repetitions
    rep_response = supabase.table("repetitions") \
        .select("*") \
        .eq("habit_id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .order("date") \
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
    expected_completions = (30 * habit["freq_num"]) / habit["freq_den"]
    completion_rate = (len(recent_reps) / expected_completions * 100) if expected_completions > 0 else 0
    completion_rate = min(completion_rate, 100.0)
    
    # Total days tracked
    if rep_response.data:
        first_date = min(date.fromisoformat(r["date"]) for r in rep_response.data)
        total_days_tracked = (date.today() - first_date).days + 1
    else:
        total_days_tracked = 0
    
    # Generate weekly data (last 12 weeks)
    weekly_data = _calculate_weekly_data(rep_response.data, habit)
    
    # Generate monthly data (last 12 months)
    monthly_data = _calculate_monthly_data(rep_response.data, habit)
    
    # Generate calendar heatmap data (last 365 days)
    calendar_heatmap = _calculate_calendar_heatmap(rep_response.data)
    
    # Calculate trend data
    trend_data = _calculate_trend_data(rep_response.data, habit)
    
    return {
        "habit_id": habit_id,
        "habit_name": habit["name"],
        "total_repetitions": total_repetitions,
        "completion_rate": completion_rate,
        "current_streak": current_streak,
        "best_streak": best_streak,
        "average_value": average_value,
        "last_completion": last_completion,
        "total_days_tracked": total_days_tracked,
        "weekly_data": weekly_data,
        "monthly_data": monthly_data,
        "calendar_heatmap": calendar_heatmap,
        "trend_data": trend_data
    }

def _calculate_weekly_data(repetitions: list, habit: dict) -> list[WeeklyChartData]:
    """Calculate weekly completion data for the last 12 weeks"""
    today = date.today()
    weekly_data = []
    
    for i in range(11, -1, -1):
        week_start = today - timedelta(days=today.weekday() + 7 * i)
        week_end = week_start + timedelta(days=6)
        
        # Count completions in this week
        completions = sum(
            1 for r in repetitions
            if week_start <= date.fromisoformat(r["date"]) <= week_end
            and r["status"] in ["completed", "partial"]
        )
        
        # Calculate target for this week
        target = habit["freq_num"]  # Assuming weekly frequency
        completion_rate = (completions / target * 100) if target > 0 else 0
        
        week_label = week_start.strftime("%b %d")
        weekly_data.append({
            "week_label": week_label,
            "completed": completions,
            "target": target,
            "completion_rate": min(completion_rate, 100.0)
        })
    
    return weekly_data

def _calculate_monthly_data(repetitions: list, habit: dict) -> list[MonthlyChartData]:
    """Calculate monthly completion data for the last 12 months"""
    today = date.today()
    monthly_data = []
    
    for i in range(11, -1, -1):
        # Calculate the month
        month_date = date(today.year, today.month, 1) - timedelta(days=30 * i)
        month_start = date(month_date.year, month_date.month, 1)
        
        # Get last day of month
        if month_date.month == 12:
            month_end = date(month_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(month_date.year, month_date.month + 1, 1) - timedelta(days=1)
        
        # Count completions in this month
        completions = sum(
            1 for r in repetitions
            if month_start <= date.fromisoformat(r["date"]) <= month_end
            and r["status"] in ["completed", "partial"]
        )
        
        # Calculate target for this month
        days_in_month = (month_end - month_start).days + 1
        target = (days_in_month * habit["freq_num"]) // habit["freq_den"]
        completion_rate = (completions / target * 100) if target > 0 else 0
        
        month_label = month_start.strftime("%b %Y")
        monthly_data.append({
            "month_label": month_label,
            "completed": completions,
            "target": target,
            "completion_rate": min(completion_rate, 100.0)
        })
    
    return monthly_data

def _calculate_calendar_heatmap(repetitions: list) -> list[CalendarHeatmapData]:
    """Calculate calendar heatmap data for the last 365 days"""
    today = date.today()
    year_ago = today - timedelta(days=365)
    
    # Create a map of dates to counts
    rep_map = {}
    for r in repetitions:
        rep_date = date.fromisoformat(r["date"])
        if rep_date >= year_ago:
            if r["status"] in ["completed", "partial"]:
                rep_map[rep_date] = rep_map.get(rep_date, 0) + 1
    
    # Find max count for normalization
    max_count = max(rep_map.values()) if rep_map else 1
    
    # Generate data for all days
    heatmap_data = []
    current_date = year_ago
    while current_date <= today:
        count = rep_map.get(current_date, 0)
        # Calculate intensity level (0-4)
        if count == 0:
            level = 0
        elif max_count == 1:
            level = 4
        else:
            level = min(4, int((count / max_count) * 4) + 1)
        
        heatmap_data.append({
            "date": current_date,
            "count": count,
            "level": level
        })
        current_date += timedelta(days=1)
    
    return heatmap_data

def _calculate_trend_data(repetitions: list, habit: dict) -> TrendData:
    """Calculate trend analysis data"""
    if not repetitions:
        return {
            "period": "month",
            "consistency_score": 0.0,
            "improvement_rate": 0.0,
            "average_completion_rate": 0.0,
            "best_day_of_week": None,
            "worst_day_of_week": None
        }
    
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    sixty_days_ago = today - timedelta(days=60)
    
    # Recent and previous period
    recent_reps = [r for r in repetitions if date.fromisoformat(r["date"]) >= thirty_days_ago]
    previous_reps = [r for r in repetitions if sixty_days_ago <= date.fromisoformat(r["date"]) < thirty_days_ago]
    
    # Calculate completion rates
    expected_per_30_days = (30 * habit["freq_num"]) / habit["freq_den"]
    recent_rate = (len(recent_reps) / expected_per_30_days * 100) if expected_per_30_days > 0 else 0
    previous_rate = (len(previous_reps) / expected_per_30_days * 100) if expected_per_30_days > 0 else 0
    
    # Improvement rate
    improvement_rate = recent_rate - previous_rate
    
    # Consistency score (based on standard deviation of daily completion)
    days_with_completion = {}
    for r in recent_reps:
        rep_date = date.fromisoformat(r["date"])
        days_with_completion[rep_date] = days_with_completion.get(rep_date, 0) + 1
    
    # Calculate consistency (inverse of coefficient of variation)
    if days_with_completion:
        values = list(days_with_completion.values())
        mean_val = sum(values) / len(values)
        if mean_val > 0:
            variance = sum((x - mean_val) ** 2 for x in values) / len(values)
            std_dev = variance ** 0.5
            cv = std_dev / mean_val
            consistency_score = max(0, min(100, 100 * (1 - cv)))
        else:
            consistency_score = 0
    else:
        consistency_score = 0
    
    # Best and worst day of week
    day_counts = {i: 0 for i in range(7)}
    day_totals = {i: 0 for i in range(7)}
    
    for r in recent_reps:
        rep_date = date.fromisoformat(r["date"])
        day_of_week = rep_date.weekday()
        if r["status"] in ["completed", "partial"]:
            day_counts[day_of_week] += 1
        day_totals[day_of_week] += 1
    
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    best_day = None
    worst_day = None
    
    if any(day_totals.values()):
        day_rates = {i: (day_counts[i] / day_totals[i] if day_totals[i] > 0 else 0) for i in range(7)}
        best_day_idx = max(day_rates, key=day_rates.get)
        worst_day_idx = min(day_rates, key=day_rates.get)
        best_day = day_names[best_day_idx]
        worst_day = day_names[worst_day_idx]
    
    return {
        "period": "month",
        "consistency_score": consistency_score,
        "improvement_rate": improvement_rate,
        "average_completion_rate": recent_rate,
        "best_day_of_week": best_day,
        "worst_day_of_week": worst_day
    }
