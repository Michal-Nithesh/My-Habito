"""
Pydantic schemas for Reminders and Notifications
"""
from pydantic import BaseModel
from typing import Optional
from datetime import time, datetime
from uuid import UUID

class ReminderBase(BaseModel):
    """Base reminder schema"""
    reminder_time: time
    days_of_week: int = 127  # Default: all days
    message: Optional[str] = None
    is_enabled: bool = True
    is_smart: bool = False

class ReminderCreate(ReminderBase):
    """Schema for creating a reminder"""
    habit_id: UUID

class ReminderUpdate(BaseModel):
    """Schema for updating a reminder"""
    reminder_time: Optional[time] = None
    days_of_week: Optional[int] = None
    message: Optional[str] = None
    is_enabled: Optional[bool] = None
    is_smart: Optional[bool] = None

class ReminderResponse(ReminderBase):
    """Schema for reminder response"""
    id: UUID
    habit_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

class NotificationPreferencesBase(BaseModel):
    """Base notification preferences schema"""
    notifications_enabled: bool = True
    daily_summary_enabled: bool = True
    daily_summary_time: time = time(9, 0)
    smart_reminders_enabled: bool = True
    smart_reminder_time: time = time(20, 0)
    push_enabled: bool = False
    email_enabled: bool = False

class NotificationPreferencesUpdate(BaseModel):
    """Schema for updating notification preferences"""
    notifications_enabled: Optional[bool] = None
    daily_summary_enabled: Optional[bool] = None
    daily_summary_time: Optional[time] = None
    smart_reminders_enabled: Optional[bool] = None
    smart_reminder_time: Optional[time] = None
    push_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None

class NotificationPreferencesResponse(NotificationPreferencesBase):
    """Schema for notification preferences response"""
    user_id: UUID
    created_at: datetime
    updated_at: datetime

class PushSubscriptionCreate(BaseModel):
    """Schema for creating a push subscription"""
    endpoint: str
    p256dh: str
    auth: str
    user_agent: Optional[str] = None

class PushSubscriptionResponse(BaseModel):
    """Schema for push subscription response"""
    id: UUID
    user_id: UUID
    endpoint: str
    created_at: datetime

class NotificationHistoryResponse(BaseModel):
    """Schema for notification history response"""
    id: UUID
    user_id: UUID
    habit_id: Optional[UUID]
    reminder_id: Optional[UUID]
    notification_type: str
    title: str
    body: str
    sent_at: datetime
    was_read: bool
    read_at: Optional[datetime]

class DailySummary(BaseModel):
    """Schema for daily summary notification data"""
    total_habits: int
    completed_today: int
    pending_habits: list[dict]
    current_streaks: list[dict]
