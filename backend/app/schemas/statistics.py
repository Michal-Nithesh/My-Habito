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

class CalendarHeatmapData(BaseModel):
    """Calendar heatmap data"""
    date: date
    count: int
    level: int  # 0-4 intensity level

class CompletionRateData(BaseModel):
    """Completion rate statistics"""
    total_days: int
    completed_days: int
    completion_percentage: float
    streak_data: list[CalendarHeatmapData]

class TrendData(BaseModel):
    """Trend analysis data"""
    period: str  # 'week', 'month', 'year'
    consistency_score: float  # 0-100
    improvement_rate: float  # percentage change
    average_completion_rate: float
    best_day_of_week: Optional[str] = None
    worst_day_of_week: Optional[str] = None

class WeeklyChartData(BaseModel):
    """Weekly chart data"""
    week_label: str
    completed: int
    target: int
    completion_rate: float

class MonthlyChartData(BaseModel):
    """Monthly chart data"""
    month_label: str
    completed: int
    target: int
    completion_rate: float

class DetailedHabitStatistics(BaseModel):
    """Detailed statistics for a habit including all analytics"""
    habit_id: UUID
    habit_name: str
    total_repetitions: int = 0
    completion_rate: float = 0.0
    current_streak: int = 0
    best_streak: int = 0
    average_value: Optional[float] = None
    last_completion: Optional[date] = None
    total_days_tracked: int = 0
    weekly_data: list[WeeklyChartData] = []
    monthly_data: list[MonthlyChartData] = []
    calendar_heatmap: list[CalendarHeatmapData] = []
    trend_data: Optional[TrendData] = None
