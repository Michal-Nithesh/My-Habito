"""
Pydantic schemas for Habits
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, date
from uuid import UUID

class HabitBase(BaseModel):
    """Base habit schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    question: Optional[str] = Field(None, max_length=500)
    habit_type: str = Field("boolean", pattern="^(boolean|numerical|duration)$")
    target_value: Optional[float] = None
    target_type: Optional[str] = Field(None, pattern="^(at_least|at_most)$")
    unit: Optional[str] = Field(None, max_length=50)
    freq_num: int = Field(1, ge=1, le=365)
    freq_den: int = Field(1, ge=1, le=365)
    weekday_schedule: int = Field(127, ge=0, le=127)  # 7 bits for 7 days
    color: int = Field(8, ge=0, le=19)
    position: int = Field(0, ge=0)
    archived: bool = False

    @validator('target_value')
    def validate_numerical_habit(cls, v, values):
        """Validate numerical habit settings"""
        if values.get('habit_type') == 'numerical' and v is None:
            raise ValueError('target_value is required for numerical habits')
        return v

class HabitCreate(HabitBase):
    """Schema for creating a new habit"""
    pass

class HabitUpdate(BaseModel):
    """Schema for updating a habit"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    question: Optional[str] = Field(None, max_length=500)
    habit_type: Optional[str] = Field(None, pattern="^(boolean|numerical|duration)$")
    target_value: Optional[float] = None
    target_type: Optional[str] = Field(None, pattern="^(at_least|at_most)$")
    unit: Optional[str] = Field(None, max_length=50)
    freq_num: Optional[int] = Field(None, ge=1, le=365)
    freq_den: Optional[int] = Field(None, ge=1, le=365)
    weekday_schedule: Optional[int] = Field(None, ge=0, le=127)
    color: Optional[int] = Field(None, ge=0, le=19)
    position: Optional[int] = Field(None, ge=0)
    archived: Optional[bool] = None

class HabitResponse(HabitBase):
    """Schema for habit response"""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HabitWithStats(HabitResponse):
    """Habit with statistics"""
    total_repetitions: int = 0
    current_streak: int = 0
    best_streak: int = 0
    completion_rate: float = 0.0
    last_completion: Optional[datetime] = None
