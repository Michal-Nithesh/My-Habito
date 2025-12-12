"""
Streak Calculator Service
Ported from Loop Habit Tracker's StreakList.kt
Exact implementation matching Loop's streak calculation logic
"""
from datetime import date, timedelta
from typing import List, Dict, Optional
from uuid import UUID
from supabase import Client
from app.core.constants import (
    ENTRY_YES_MANUAL,
    ENTRY_YES_AUTO,
    ENTRY_NO,
    ENTRY_SKIP,
    ENTRY_UNKNOWN
)

class Streak:
    """Represents a single streak"""
    def __init__(self, start: date, end: date):
        self.start = start
        self.end = end
    
    @property
    def length(self) -> int:
        """Calculate streak length in days"""
        return (self.end - self.start).days + 1
    
    def compare_longer(self, other: 'Streak') -> int:
        """Compare by length, then by recency"""
        if self.length != other.length:
            return 1 if self.length > other.length else -1
        return self.compare_newer(other)
    
    def compare_newer(self, other: 'Streak') -> int:
        """Compare by end date"""
        if self.end > other.end:
            return 1
        elif self.end < other.end:
            return -1
        return 0

class StreakCalculator:
    """
    Calculate streaks for habits based on Loop Habit Tracker's algorithm
    
    A streak is a continuous sequence of successful days.
    The algorithm from StreakList.kt groups consecutive completion dates.
    """
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    def recompute_streaks(
        self,
        habit_id: UUID,
        user_id: UUID,
        from_date: date,
        to_date: date,
        is_numerical: bool = False,
        target_value: float = 0.0,
        numerical_type: str = "AT_LEAST"  # AT_LEAST or AT_MOST
    ) -> List[Streak]:
        """
        Recompute all streaks for a habit using Loop's exact algorithm from StreakList.kt
        
        Args:
            habit_id: Habit UUID
            user_id: User UUID
            from_date: Start date for streak calculation
            to_date: End date for streak calculation
            is_numerical: Whether habit tracks numerical values
            target_value: Target value for numerical habits
            numerical_type: "AT_LEAST" or "AT_MOST"
        
        Returns:
            List of Streak objects
        """
        # Get all repetitions (computed entries) for this habit
        response = self.supabase.table("repetitions") \
            .select("date, value") \
            .eq("habit_id", str(habit_id)) \
            .eq("user_id", str(user_id)) \
            .gte("date", from_date.isoformat()) \
            .lte("date", to_date.isoformat()) \
            .order("date", desc=False) \
            .execute()
        
        if not response.data:
            return []
        
        # Filter entries based on whether they count as "successful"
        timestamps = []
        is_at_most = numerical_type == "AT_MOST"
        
        for entry in response.data:
            entry_date = date.fromisoformat(entry['date'])
            value = entry['value']
            
            # Determine if this entry counts as successful
            is_successful = False
            
            if is_numerical:
                # For numerical habits, check against target
                if is_at_most:
                    # AT_MOST: value must be known and <= target
                    is_successful = (value != ENTRY_UNKNOWN and value / 1000.0 <= target_value)
                else:
                    # AT_LEAST: value must be >= target
                    is_successful = (value / 1000.0 >= target_value)
            else:
                # For boolean habits, any positive value counts
                is_successful = (value > 0)
            
            if is_successful:
                timestamps.append(entry_date)
        
        if not timestamps:
            return []
        
        # Group consecutive timestamps into streaks (matching StreakList.kt logic)
        streaks = []
        begin = timestamps[0]
        end = timestamps[0]
        
        for i in range(1, len(timestamps)):
            current = timestamps[i]
            
            # Check if current date is exactly one day before begin (consecutive)
            if current == begin - timedelta(days=1):
                begin = current
            else:
                # Streak ended, save it
                streaks.append(Streak(begin, end))
                begin = current
                end = current
        
        # Add the final streak
        streaks.append(Streak(begin, end))
        
        return streaks
    
    def get_best_streaks(self, streaks: List[Streak], limit: int = 10) -> List[Streak]:
        """
        Get the best (longest) streaks, sorted by length then recency
        Matches StreakList.kt's getBest() method
        
        Args:
            streaks: List of all streaks
            limit: Maximum number of streaks to return
        
        Returns:
            List of best streaks
        """
        if not streaks:
            return []
        
        # Sort by length (longest first), then by recency
        sorted_streaks = sorted(streaks, key=lambda s: (-s.length, s.end), reverse=False)
        
        # Take top N
        best_streaks = sorted_streaks[:min(len(sorted_streaks), limit)]
        
        # Sort by recency (newest first)
        best_streaks.sort(key=lambda s: s.end, reverse=True)
        
        return best_streaks
    
    def get_current_streak(
        self,
        habit_id: UUID,
        user_id: UUID,
        is_numerical: bool = False,
        target_value: float = 0.0,
        numerical_type: str = "AT_LEAST"
    ) -> int:
        """
        Get the current streak length for a habit
        
        Returns:
            Current streak length in days
        """
        # Calculate streaks up to today
        today = date.today()
        # Start from 1 year ago to get sufficient history
        from_date = today - timedelta(days=365)
        
        streaks = self.recompute_streaks(
            habit_id, user_id, from_date, today,
            is_numerical, target_value, numerical_type
        )
        
        if not streaks:
            return 0
        
        # Check if the last streak includes today or yesterday (allowing for one day gap)
        last_streak = streaks[-1]
        days_since_end = (today - last_streak.end).days
        
        # Current streak if it ended today or yesterday
        if days_since_end <= 1:
            return last_streak.length
        
        return 0
    
    def get_best_streak(
        self,
        habit_id: UUID,
        user_id: UUID,
        is_numerical: bool = False,
        target_value: float = 0.0,
        numerical_type: str = "AT_LEAST"
    ) -> int:
        """
        Get the longest streak for a habit
        
        Returns:
            Longest streak length in days
        """
        today = date.today()
        # Start from sufficient history
        from_date = today - timedelta(days=730)  # 2 years
        
        streaks = self.recompute_streaks(
            habit_id, user_id, from_date, today,
            is_numerical, target_value, numerical_type
        )
        
        if not streaks:
            return 0
        
        return max(streak.length for streak in streaks)
    
    async def save_streaks(
        self,
        habit_id: UUID,
        user_id: UUID,
        streaks: List[Streak]
    ):
        """Save calculated streaks to database"""
        # Delete existing streaks
        self.supabase.table("streaks") \
            .delete() \
            .eq("habit_id", str(habit_id)) \
            .execute()
        
        # Insert new streaks
        if streaks:
            streak_data = [
                {
                    "habit_id": str(habit_id),
                    "user_id": str(user_id),
                    "start_date": streak.start.isoformat(),
                    "end_date": streak.end.isoformat(),
                    "length": streak.length
                }
                for streak in streaks
            ]
            
            self.supabase.table("streaks") \
                .insert(streak_data) \
                .execute()
