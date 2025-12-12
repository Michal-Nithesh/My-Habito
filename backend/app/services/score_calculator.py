"""
Score Calculator Service
Ported from Loop Habit Tracker's scoring algorithm
Exact implementation from Score.kt and ScoreList.kt
"""
import math
from datetime import date, timedelta, datetime
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

class ScoreCalculator:
    """
    Calculate habit scores using Loop Habit Tracker's exact algorithm
    
    The score represents habit strength, ranging from 0.0 to 1.0.
    Formula: score_new = score_old * multiplier + checkmark_value * (1 - multiplier)
    Where: multiplier = 0.5^(sqrt(frequency) / 13.0)
    
    Algorithm ported from Loop Habit Tracker's Score.kt and ScoreList.kt
    """
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    @staticmethod
    def compute(frequency: float, previous_score: float, checkmark_value: float) -> float:
        """
        Given the frequency of the habit, the previous score, and the value of
        the current checkmark, computes the current score for the habit.

        The frequency of the habit is the number of repetitions divided by the
        length of the interval. For example, a habit that should be repeated 3
        times in 8 days has frequency 3.0 / 8.0 = 0.375.
        
        This is the exact formula from Score.kt in Loop Habit Tracker.
        
        Args:
            frequency: Repetitions per day (numerator / denominator)
            previous_score: Previous score value (0.0 to 1.0)
            checkmark_value: Current checkmark value (0.0 to 1.0)
        
        Returns:
            New score value (0.0 to 1.0)
        """
        multiplier = math.pow(0.5, math.sqrt(frequency) / 13.0)
        score = previous_score * multiplier
        score += checkmark_value * (1 - multiplier)
        return score
    
    def recompute_scores(
        self,
        habit_id: UUID,
        user_id: UUID,
        freq_num: int,
        freq_den: int,
        is_numerical: bool = False,
        target_value: float = 0.0,
        numerical_type: str = "AT_LEAST",  # AT_LEAST or AT_MOST
        from_date: Optional[date] = None,
        to_date: Optional[date] = None
    ) -> List[Dict]:
        """
        Recompute all scores for a habit using Loop's exact algorithm from ScoreList.kt
        
        Args:
            habit_id: Habit UUID
            user_id: User UUID
            freq_num: Frequency numerator (e.g., 3 in "3 times per 7 days")
            freq_den: Frequency denominator (e.g., 7 in "3 times per 7 days")
            is_numerical: Whether habit tracks numerical values
            target_value: Target value for numerical habits (in thousandths)
            numerical_type: "AT_LEAST" or "AT_MOST"
            from_date: Start date for recomputation
            to_date: End date for recomputation
        
        Returns:
            List of score dictionaries with date, timestamp, and score
        """
        # Get all repetitions (entries) for this habit
        query = self.supabase.table("repetitions") \
            .select("date, value") \
            .eq("habit_id", str(habit_id)) \
            .eq("user_id", str(user_id)) \
            .order("date", desc=False)
        
        if from_date:
            query = query.gte("date", from_date.isoformat())
        if to_date:
            query = query.lte("date", to_date.isoformat())
        
        response = query.execute()
        
        if not response.data:
            return []
        
        # Convert to list of (date, value) tuples
        entries = [(date.fromisoformat(r['date']), r['value']) for r in response.data]
        
        if not entries:
            return []
        
        # Determine date range
        first_date = entries[0][0]
        last_date = entries[-1][0]
        
        if from_date and from_date < first_date:
            first_date = from_date
        if to_date and to_date > last_date:
            last_date = to_date
        
        # Create entry map for quick lookup
        entry_map = {d: v for d, v in entries}
        
        # Build values array (matching ScoreList.kt logic)
        num_days = (last_date - first_date).days + 1
        values = []
        current_date = first_date
        
        for _ in range(num_days):
            if current_date in entry_map:
                values.append(entry_map[current_date])
            else:
                values.append(ENTRY_NO)
            current_date += timedelta(days=1)
        
        # Calculate frequency
        freq = freq_num / freq_den
        numerator = freq_num
        denominator = freq_den
        
        # For non-daily boolean habits, double numerator and denominator to smooth out schedules
        if not is_numerical and freq < 1.0:
            numerator *= 2
            denominator *= 2
        
        # Recompute scores day by day
        scores = []
        rolling_sum = 0.0
        previous_value = 1.0 if (is_numerical and numerical_type == "AT_MOST") else 0.0
        is_at_most = numerical_type == "AT_MOST"
        
        for i in range(len(values)):
            offset = len(values) - i - 1
            
            if is_numerical:
                # Numerical habit scoring
                rolling_sum += max(0, values[offset])
                
                # Remove old values outside the window
                if offset + denominator < len(values):
                    rolling_sum -= max(0, values[offset + denominator])
                
                # Normalize (values are in thousandths in database)
                normalized_rolling_sum = rolling_sum / 1000.0
                
                if values[offset] != ENTRY_SKIP:
                    # Calculate percentage completed
                    if not is_at_most:
                        # AT_LEAST: percentage = min(1.0, actual / target)
                        if target_value > 0:
                            percentage_completed = min(1.0, normalized_rolling_sum / target_value)
                        else:
                            percentage_completed = 1.0
                    else:
                        # AT_MOST: percentage = max(0, 1 - (actual - target) / target)
                        if target_value > 0:
                            percentage_completed = max(0.0, min(1.0, 
                                1 - ((normalized_rolling_sum - target_value) / target_value)))
                        else:
                            percentage_completed = 0.0 if normalized_rolling_sum > 0 else 1.0
                    
                    previous_value = self.compute(freq, previous_value, percentage_completed)
            else:
                # Boolean habit scoring
                if values[offset] == ENTRY_YES_MANUAL:
                    rolling_sum += 1.0
                
                if offset + denominator < len(values):
                    if values[offset + denominator] == ENTRY_YES_MANUAL:
                        rolling_sum -= 1.0
                
                if values[offset] != ENTRY_SKIP:
                    percentage_completed = min(1.0, rolling_sum / numerator)
                    previous_value = self.compute(freq, previous_value, percentage_completed)
            
            # Store score for this date
            score_date = first_date + timedelta(days=i)
            timestamp = int(datetime.combine(score_date, datetime.min.time()).timestamp() * 1000)
            
            scores.append({
                "date": score_date,
                "timestamp": timestamp,
                "score": previous_value
            })
        
        return scores
    
    def calculate_current_score(
        self,
        habit_id: UUID,
        user_id: UUID,
        freq_num: int,
        freq_den: int,
        is_numerical: bool = False,
        target_value: float = 0.0,
        numerical_type: str = "AT_LEAST"
    ) -> float:
        """
        Calculate the current score for a habit
        
        Returns:
            Score value (0.0 to 1.0)
        """
        scores = self.recompute_scores(
            habit_id, user_id, freq_num, freq_den,
            is_numerical, target_value, numerical_type,
            to_date=date.today()
        )
        
        if not scores:
            return 0.0
        
        return scores[-1]["score"]
    
    def calculate_score_history(
        self,
        habit_id: UUID,
        user_id: UUID,
        start_date: date,
        end_date: date,
        freq_num: int,
        freq_den: int,
        is_numerical: bool = False,
        target_value: float = 0.0,
        numerical_type: str = "AT_LEAST"
    ) -> List[Dict]:
        """
        Calculate score history for a date range
        
        Returns:
            List of {"date": date, "timestamp": int, "score": float} dictionaries
        """
        return self.recompute_scores(
            habit_id, user_id, freq_num, freq_den,
            is_numerical, target_value, numerical_type,
            from_date=start_date, to_date=end_date
        )
    
    async def save_scores(
        self,
        habit_id: UUID,
        user_id: UUID,
        scores: List[Dict]
    ):
        """Save calculated scores to database"""
        if not scores:
            return
        
        # Prepare score data
        score_data = [
            {
                "habit_id": str(habit_id),
                "user_id": str(user_id),
                "timestamp": score["timestamp"],
                "date": score["date"].isoformat(),
                "score": score["score"]  # Store as 0.0 to 1.0
            }
            for score in scores
        ]
        
        # Insert scores (on conflict, update)
        for score_entry in score_data:
            self.supabase.table("scores") \
                .upsert(score_entry, on_conflict="habit_id,date") \
                .execute()
    
    @staticmethod
    def get_score_percentage(score: float) -> float:
        """Convert score to percentage (0-100)"""
        return score * 100.0

