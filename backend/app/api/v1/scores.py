"""
Scores API Router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from typing import List
from uuid import UUID
from datetime import date, timedelta

from app.core.database import SupabaseClient, get_supabase
from app.core.security import get_current_user
from app.schemas.score import ScoreResponse, ScoreHistory
from app.services.score_calculator import ScoreCalculator

router = APIRouter()

@router.get("/habit/{habit_id}/current")
async def get_current_score(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get current score for a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify habit exists
    habit_response = supabase.table("habits") \
        .select("id, freq_num, freq_den") \
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
    
    # Calculate current score
    score_calc = ScoreCalculator(supabase)
    score = score_calc.calculate_current_score(
        habit_id,
        UUID(current_user["id"]),
        habit["freq_num"],
        habit["freq_den"]
    )
    
    return {
        "habit_id": habit_id,
        "score": score,
        "score_percentage": score_calc.get_score_percentage(score)
    }

@router.get("/habit/{habit_id}/history", response_model=ScoreHistory)
async def get_score_history(
    habit_id: UUID,
    days: int = Query(90, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get score history for a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify habit exists
    habit_response = supabase.table("habits") \
        .select("id, freq_num, freq_den") \
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
    
    # Calculate score history
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    score_calc = ScoreCalculator(supabase)
    scores = score_calc.calculate_score_history(
        habit_id,
        UUID(current_user["id"]),
        start_date,
        end_date,
        habit["freq_num"],
        habit["freq_den"]
    )
    
    # Convert to response format
    score_responses = [
        {
            "id": None,
            "habit_id": habit_id,
            "user_id": UUID(current_user["id"]),
            "timestamp": s["timestamp"],
            "date": s["date"],
            "score": s["score"],
            "created_at": None
        }
        for s in scores
    ]
    
    current_score = scores[-1]["score"] if scores else 0
    
    return {
        "habit_id": habit_id,
        "scores": score_responses,
        "current_score": current_score
    }

@router.post("/habit/{habit_id}/recalculate")
async def recalculate_scores(
    habit_id: UUID,
    days: int = Query(90, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Recalculate and save scores for a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify habit exists
    habit_response = supabase.table("habits") \
        .select("id, freq_num, freq_den") \
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
    
    # Calculate and save scores
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    score_calc = ScoreCalculator(supabase)
    scores = score_calc.calculate_score_history(
        habit_id,
        UUID(current_user["id"]),
        start_date,
        end_date,
        habit["freq_num"],
        habit["freq_den"]
    )
    
    await score_calc.save_scores(habit_id, UUID(current_user["id"]), scores)
    
    return {
        "message": "Scores recalculated successfully",
        "scores_calculated": len(scores)
    }
