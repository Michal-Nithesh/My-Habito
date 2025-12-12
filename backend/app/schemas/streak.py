"""
Pydantic schemas for Streaks
"""
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import UUID

class StreakBase(BaseModel):
    """Base streak schema"""
    habit_id: UUID
    start_date: date
    end_date: date
    length: int = Field(..., ge=1)

class StreakCreate(StreakBase):
    """Schema for creating a streak"""
    pass

class StreakResponse(StreakBase):
    """Schema for streak response"""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StreakSummary(BaseModel):
    """Summary of streaks for a habit"""
    habit_id: UUID
    current_streak: int = 0
    best_streak: int = 0
    total_streaks: int = 0
    streaks: list[StreakResponse] = []
