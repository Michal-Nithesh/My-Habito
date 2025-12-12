"""
Pydantic schemas for Repetitions
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, date, time
from uuid import UUID

class RepetitionBase(BaseModel):
    """Base repetition schema"""
    habit_id: UUID
    timestamp: int = Field(..., description="Unix timestamp in milliseconds")
    date: date
    status: str = Field("completed", description="Status: 'completed', 'skipped', 'failed', 'partial'")
    value: int = Field(1, ge=0)
    completion_time: Optional[time] = None
    notes: Optional[str] = None

class RepetitionCreate(BaseModel):
    """Schema for creating a repetition"""
    habit_id: UUID
    timestamp: Optional[int] = None  # Will be auto-generated if not provided
    date: Optional[date] = None  # Will be auto-generated if not provided
    status: str = Field("completed", description="Status: 'completed', 'skipped', 'failed', 'partial'")
    value: int = Field(1, ge=0)
    completion_time: Optional[time] = None
    notes: Optional[str] = None

    @validator('status')
    def validate_status(cls, v):
        """Validate status value"""
        valid_statuses = ['completed', 'skipped', 'failed', 'partial']
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of {valid_statuses}")
        return v

    @validator('timestamp', always=True)
    def set_timestamp(cls, v):
        """Set timestamp if not provided"""
        if v is None:
            return int(datetime.now().timestamp() * 1000)
        return v

    @validator('date', always=True)
    def set_date(cls, v, values):
        """Set date from timestamp if not provided"""
        if v is None and 'timestamp' in values:
            timestamp_seconds = values['timestamp'] / 1000
            return datetime.fromtimestamp(timestamp_seconds).date()
        return v

class RepetitionUpdate(BaseModel):
    """Schema for updating a repetition"""
    status: Optional[str] = None
    value: Optional[int] = Field(None, ge=0)
    completion_time: Optional[time] = None
    notes: Optional[str] = None

    @validator('status')
    def validate_status(cls, v):
        """Validate status value"""
        if v is not None:
            valid_statuses = ['completed', 'skipped', 'failed', 'partial']
            if v not in valid_statuses:
                raise ValueError(f"Status must be one of {valid_statuses}")
        return v

class RepetitionResponse(RepetitionBase):
    """Schema for repetition response"""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RepetitionList(BaseModel):
    """List of repetitions with pagination"""
    items: list[RepetitionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
