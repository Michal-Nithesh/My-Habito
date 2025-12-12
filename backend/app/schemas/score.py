"""
Pydantic schemas for Scores
"""
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import UUID

class ScoreBase(BaseModel):
    """Base score schema"""
    habit_id: UUID
    timestamp: int = Field(..., description="Unix timestamp in milliseconds")
    date: date
    score: int = Field(..., ge=0, le=100000, description="Score from 0 to 100000")

class ScoreCreate(ScoreBase):
    """Schema for creating a score"""
    pass

class ScoreResponse(ScoreBase):
    """Schema for score response"""
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

    @property
    def score_percentage(self) -> float:
        """Get score as percentage (0-100)"""
        return self.score / 1000.0

class ScoreHistory(BaseModel):
    """Historical scores for a habit"""
    habit_id: UUID
    scores: list[ScoreResponse]
    current_score: int = 0
    
    @property
    def current_score_percentage(self) -> float:
        """Current score as percentage"""
        return self.current_score / 1000.0
