"""
Reminders API Router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from uuid import UUID
from datetime import datetime

from app.core.database import SupabaseClient
from app.core.security import get_current_user
from app.schemas.reminder import (
    ReminderCreate,
    ReminderUpdate,
    ReminderResponse,
    NotificationPreferencesUpdate,
    NotificationPreferencesResponse,
    PushSubscriptionCreate,
    PushSubscriptionResponse,
    NotificationHistoryResponse
)

router = APIRouter()

# ==================== REMINDERS ====================

@router.get("/habit/{habit_id}", response_model=List[ReminderResponse])
async def get_habit_reminders(
    habit_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get all reminders for a specific habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify habit ownership
    habit_response = supabase.table("habits") \
        .select("id") \
        .eq("id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not habit_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    # Get reminders
    response = supabase.table("reminders") \
        .select("*") \
        .eq("habit_id", str(habit_id)) \
        .eq("user_id", current_user["id"]) \
        .order("reminder_time") \
        .execute()
    
    return response.data

@router.get("/user", response_model=List[ReminderResponse])
async def get_user_reminders(
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get all reminders for the current user"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    response = supabase.table("reminders") \
        .select("*") \
        .eq("user_id", current_user["id"]) \
        .order("reminder_time") \
        .execute()
    
    return response.data

@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    reminder: ReminderCreate,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Create a new reminder for a habit"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify habit ownership
    habit_response = supabase.table("habits") \
        .select("id") \
        .eq("id", str(reminder.habit_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not habit_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    # Create reminder
    reminder_data = reminder.model_dump()
    reminder_data["user_id"] = current_user["id"]
    reminder_data["habit_id"] = str(reminder.habit_id)
    reminder_data["reminder_time"] = reminder.reminder_time.isoformat()
    
    response = supabase.table("reminders") \
        .insert(reminder_data) \
        .execute()
    
    return response.data[0]

@router.patch("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: UUID,
    reminder_update: ReminderUpdate,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Update a reminder"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify ownership
    existing = supabase.table("reminders") \
        .select("*") \
        .eq("id", str(reminder_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    # Update reminder
    update_data = reminder_update.model_dump(exclude_unset=True)
    if "reminder_time" in update_data and update_data["reminder_time"]:
        update_data["reminder_time"] = update_data["reminder_time"].isoformat()
    
    response = supabase.table("reminders") \
        .update(update_data) \
        .eq("id", str(reminder_id)) \
        .execute()
    
    return response.data[0]

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    reminder_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Delete a reminder"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Verify ownership
    existing = supabase.table("reminders") \
        .select("id") \
        .eq("id", str(reminder_id)) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    supabase.table("reminders") \
        .delete() \
        .eq("id", str(reminder_id)) \
        .execute()

# ==================== NOTIFICATION PREFERENCES ====================

@router.get("/preferences", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get user's notification preferences"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    response = supabase.table("notification_preferences") \
        .select("*") \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if not response.data:
        # Create default preferences
        default_prefs = {
            "user_id": current_user["id"],
            "notifications_enabled": True,
            "daily_summary_enabled": True,
            "daily_summary_time": "09:00:00",
            "smart_reminders_enabled": True,
            "smart_reminder_time": "20:00:00",
            "push_enabled": False,
            "email_enabled": False
        }
        response = supabase.table("notification_preferences") \
            .insert(default_prefs) \
            .execute()
    
    return response.data

@router.patch("/preferences", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    preferences: NotificationPreferencesUpdate,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Update user's notification preferences"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Check if preferences exist
    existing = supabase.table("notification_preferences") \
        .select("user_id") \
        .eq("user_id", current_user["id"]) \
        .execute()
    
    update_data = preferences.model_dump(exclude_unset=True)
    if "daily_summary_time" in update_data and update_data["daily_summary_time"]:
        update_data["daily_summary_time"] = update_data["daily_summary_time"].isoformat()
    if "smart_reminder_time" in update_data and update_data["smart_reminder_time"]:
        update_data["smart_reminder_time"] = update_data["smart_reminder_time"].isoformat()
    
    if not existing.data:
        # Insert new preferences
        update_data["user_id"] = current_user["id"]
        response = supabase.table("notification_preferences") \
            .insert(update_data) \
            .execute()
    else:
        # Update existing preferences
        response = supabase.table("notification_preferences") \
            .update(update_data) \
            .eq("user_id", current_user["id"]) \
            .execute()
    
    return response.data[0] if isinstance(response.data, list) else response.data

# ==================== PUSH SUBSCRIPTIONS ====================

@router.post("/push/subscribe", response_model=PushSubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def subscribe_to_push(
    subscription: PushSubscriptionCreate,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Subscribe to push notifications"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    # Check if subscription already exists
    existing = supabase.table("push_subscriptions") \
        .select("id") \
        .eq("endpoint", subscription.endpoint) \
        .execute()
    
    if existing.data:
        return existing.data[0]
    
    # Create new subscription
    sub_data = subscription.model_dump()
    sub_data["user_id"] = current_user["id"]
    
    response = supabase.table("push_subscriptions") \
        .insert(sub_data) \
        .execute()
    
    return response.data[0]

@router.delete("/push/unsubscribe", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe_from_push(
    endpoint: str,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Unsubscribe from push notifications"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    supabase.table("push_subscriptions") \
        .delete() \
        .eq("user_id", current_user["id"]) \
        .eq("endpoint", endpoint) \
        .execute()

# ==================== NOTIFICATION HISTORY ====================

@router.get("/history", response_model=List[NotificationHistoryResponse])
async def get_notification_history(
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Get user's notification history"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    response = supabase.table("notification_history") \
        .select("*") \
        .eq("user_id", current_user["id"]) \
        .order("sent_at", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()
    
    return response.data

@router.patch("/history/{notification_id}/read", response_model=NotificationHistoryResponse)
async def mark_notification_read(
    notification_id: UUID,
    current_user: dict = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Mark a notification as read"""
    supabase = SupabaseClient.get_client(credentials.credentials)
    
    response = supabase.table("notification_history") \
        .update({
            "was_read": True,
            "read_at": datetime.utcnow().isoformat()
        }) \
        .eq("id", str(notification_id)) \
        .eq("user_id", current_user["id"]) \
        .execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return response.data[0]
