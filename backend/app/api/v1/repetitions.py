"""
Repetitions API Router
CRUD operations for habit check-ins
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime

from app.core.database import SupabaseClient, get_supabase
from app.core.security import get_current_user
from app.schemas.repetition import RepetitionCreate, RepetitionUpdate, RepetitionResponse
from app.services.streak_calculator import StreakCalculator
from app.services.score_calculator import ScoreCalculator

router = APIRouter()

@router.get("/", response_model=List[RepetitionResponse])
async def list_repetitions(
    habit_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get repetitions for the current user"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    query = supabase.table("repetitions") \
        .select("*") \
        .eq("user_id", current_user["id"])
    
    if habit_id:
        query = query.eq("habit_id", str(habit_id))
    
    if start_date:
        query = query.gte("date", start_date.isoformat())
    
    if end_date:
        query = query.lte("date", end_date.isoformat())
    
    response = query.order("date", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()
    
    return response.data

@router.get("/{repetition_id}", response_model=RepetitionResponse)
async def get_repetition(
    repetition_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get a specific repetition"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    response = supabase.table("repetitions") \
        .select("*") \
        .eq("id", str(repetition_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repetition not found"
        )
    
    return response.data

@router.post("/", response_model=RepetitionResponse, status_code=status.HTTP_201_CREATED)
async def create_repetition(
    repetition: RepetitionCreate,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Record a new check-in"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify habit exists and belongs to user
    habit_response = supabase.table("habits") \
        .select("id, freq_num, freq_den, weekday_schedule") \
        .eq("id", str(repetition.habit_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not habit_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    # Prepare repetition data
    repetition_data = repetition.dict()
    repetition_data["user_id"] = current_user["id"]
    repetition_data["habit_id"] = str(repetition.habit_id)
    
    # Convert date to string if needed
    if isinstance(repetition_data.get("date"), date):
        repetition_data["date"] = repetition_data["date"].isoformat()
    
    # Insert repetition (upsert to handle same-day updates)
    response = supabase.table("repetitions") \
        .upsert(repetition_data, on_conflict="habit_id,date") \
        .execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create repetition"
        )
    
    # Recalculate streaks asynchronously
    habit = habit_response.data
    streak_calc = StreakCalculator(supabase)
    streaks = streak_calc.calculate_streaks(
        repetition.habit_id,
        UUID(current_user["id"]),
        habit["freq_num"],
        habit["freq_den"],
        habit["weekday_schedule"]
    )
    await streak_calc.save_streaks(repetition.habit_id, UUID(current_user["id"]), streaks)
    
    return response.data[0]

@router.put("/{repetition_id}", response_model=RepetitionResponse)
async def update_repetition(
    repetition_id: UUID,
    repetition_update: RepetitionUpdate,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Update a repetition"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify ownership
    existing = supabase.table("repetitions") \
        .select("id, habit_id") \
        .eq("id", str(repetition_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repetition not found"
        )
    
    # Update
    update_data = repetition_update.dict(exclude_unset=True)
    
    response = supabase.table("repetitions") \
        .update(update_data) \
        .eq("id", str(repetition_id)) \
        .execute()
    
    # Recalculate streaks
    habit_id = UUID(existing.data["habit_id"])
    habit_response = supabase.table("habits") \
        .select("freq_num, freq_den, weekday_schedule") \
        .eq("id", str(habit_id)) \
        .single() \
        .execute()
    
    if habit_response.data:
        habit = habit_response.data
        streak_calc = StreakCalculator(supabase)
        streaks = streak_calc.calculate_streaks(
            habit_id,
            UUID(current_user["id"]),
            habit["freq_num"],
            habit["freq_den"],
            habit["weekday_schedule"]
        )
        await streak_calc.save_streaks(habit_id, UUID(current_user["id"]), streaks)
    
    return response.data[0]

@router.delete("/{repetition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_repetition(
    repetition_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Delete a repetition"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify ownership and get habit_id
    existing = supabase.table("repetitions") \
        .select("id, habit_id") \
        .eq("id", str(repetition_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repetition not found"
        )
    
    habit_id = UUID(existing.data["habit_id"])
    
    # Delete
    supabase.table("repetitions") \
        .delete() \
        .eq("id", str(repetition_id)) \
        .execute()
    
    # Recalculate streaks
    habit_response = supabase.table("habits") \
        .select("freq_num, freq_den, weekday_schedule") \
        .eq("id", str(habit_id)) \
        .single() \
        .execute()
    
    if habit_response.data:
        habit = habit_response.data
        streak_calc = StreakCalculator(supabase)
        streaks = streak_calc.calculate_streaks(
            habit_id,
            UUID(current_user["id"]),
            habit["freq_num"],
            habit["freq_den"],
            habit["weekday_schedule"]
        )
        await streak_calc.save_streaks(habit_id, UUID(current_user["id"]), streaks)
    
    return None

@router.get("/habit/{habit_id}/today", response_model=Optional[RepetitionResponse])
async def get_today_repetition(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get today's repetition for a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    today = date.today()
    
    response = supabase.table("repetitions") \
        .select("*") \
        .eq("habit_id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .eq("date", today.isoformat()) \
        .single() \
        .execute()
    
    return response.data if response.data else None

@router.post("/habit/{habit_id}/toggle")
async def toggle_today(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Toggle today's check-in for a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    today = date.today()
    timestamp = int(datetime.now().timestamp() * 1000)
    
    # Check if already exists
    existing = supabase.table("repetitions") \
        .select("id") \
        .eq("habit_id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .eq("date", today.isoformat()) \
        .execute()
    
    if existing.data:
        # Delete if exists (toggle off)
        supabase.table("repetitions") \
            .delete() \
            .eq("id", existing.data[0]["id"]) \
            .execute()
        
        return {"status": "deleted", "habit_id": str(habit_id), "date": today.isoformat()}
    else:
        # Create if doesn't exist (toggle on)
        repetition_data = {
            "habit_id": str(habit_id),
            "user_id": current_user["id"],
            "timestamp": timestamp,
            "date": today.isoformat(),
            "value": 1
        }
        
        response = supabase.table("repetitions") \
            .insert(repetition_data) \
            .execute()
        
        return response.data[0] if response.data else {"status": "created", "habit_id": str(habit_id), "date": today.isoformat()}
