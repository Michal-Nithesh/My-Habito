"""
Pydantic schemas for Statistics
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date
from uuid import UUID

class HabitStatistics(BaseModel):
    """Statistics for a single habit"""
    habit_id: UUID
    habit_name: str
    total_repetitions: int = 0
    completion_rate: float = 0.0
    current_streak: int = 0
    best_streak: int = 0
    average_value: Optional[float] = None
    last_completion: Optional[date] = None
    total_days_tracked: int = 0

class OverviewStatistics(BaseModel):
    """Overview statistics for all habits"""
    total_habits: int = 0
    active_habits: int = 0
    archived_habits: int = 0
    total_repetitions: int = 0
    total_repetitions_today: int = 0
    habits_completed_today: int = 0
    longest_streak: int = 0
    average_completion_rate: float = 0.0

class FrequencyData(BaseModel):
    """Frequency data for charts"""
    date: date
    count: int
    target: int
    percentage: float

class ChartData(BaseModel):
    """Chart data for habit visualization"""
    labels: list[str]
    values: list[float]
    dates: list[date]
