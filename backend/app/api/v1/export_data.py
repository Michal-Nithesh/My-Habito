"""
Export API Router
Data export functionality
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from supabase import Client
from uuid import UUID
from datetime import date
import io
import csv

from app.core.database import SupabaseClient, get_supabase
from app.core.security import get_current_user

router = APIRouter()

@router.get("/csv")
async def export_all_data_csv(
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Export all user data as CSV"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    user_id = current_user["id"]
    
    # Get all habits
    habits_response = supabase.table("habits") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()
    
    # Get all repetitions
    repetitions_response = supabase.table("repetitions") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("date", desc=False) \
        .execute()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Habit Name",
        "Habit Type",
        "Date",
        "Value",
        "Notes",
        "Frequency",
        "Color",
        "Created At"
    ])
    
    # Create habit lookup
    habits_dict = {h["id"]: h for h in habits_response.data}
    
    # Write repetitions
    for rep in repetitions_response.data:
        habit = habits_dict.get(rep["habit_id"])
        if habit:
            frequency = f"{habit['freq_num']}/{habit['freq_den']}"
            writer.writerow([
                habit["name"],
                habit["habit_type"],
                rep["date"],
                rep["value"],
                rep.get("notes", ""),
                frequency,
                habit["color"],
                rep["created_at"]
            ])
    
    # Prepare response
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=habito_export_{date.today().isoformat()}.csv"
        }
    )

@router.get("/habit/{habit_id}/csv")
async def export_habit_csv(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Export specific habit data as CSV"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    user_id = current_user["id"]
    
    # Get habit
    habit_response = supabase.table("habits") \
        .select("*") \
        .eq("id", str(habit_id)) \
        .eq("user_id", user_id) \
        .single() \
        .execute()
    
    if not habit_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    habit = habit_response.data
    
    # Get repetitions
    repetitions_response = supabase.table("repetitions") \
        .select("*") \
        .eq("habit_id", str(habit_id)) \
        .eq("user_id", user_id) \
        .order("date", desc=False) \
        .execute()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Date",
        "Value",
        "Notes",
        "Timestamp"
    ])
    
    # Write repetitions
    for rep in repetitions_response.data:
        writer.writerow([
            rep["date"],
            rep["value"],
            rep.get("notes", ""),
            rep["timestamp"]
        ])
    
    # Prepare response
    output.seek(0)
    
    habit_name_safe = "".join(c for c in habit["name"] if c.isalnum() or c in (' ', '-', '_')).strip()
    filename = f"habit_{habit_name_safe}_{date.today().isoformat()}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/json")
async def export_all_data_json(
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Export all user data as JSON"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    user_id = current_user["id"]
    
    # Get all data
    habits_response = supabase.table("habits") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()
    
    repetitions_response = supabase.table("repetitions") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()
    
    streaks_response = supabase.table("streaks") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()
    
    return {
        "export_date": date.today().isoformat(),
        "user_id": user_id,
        "habits": habits_response.data,
        "repetitions": repetitions_response.data,
        "streaks": streaks_response.data
    }
