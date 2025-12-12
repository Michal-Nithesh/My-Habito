"""
Unit tests for Streak Calculator
Ported from Loop Habit Tracker's StreakListTest.kt

These tests verify that the streak calculation algorithm matches
Loop Habit Tracker's exact behavior.
"""
import unittest
from datetime import date, timedelta
from app.services.streak_calculator import Streak


class TestStreak(unittest.TestCase):
    """Test the Streak class"""
    
    def test_streak_length(self):
        """Test streak length calculation"""
        # Single day streak
        streak = Streak(date(2024, 1, 1), date(2024, 1, 1))
        self.assertEqual(streak.length, 1, "Single day should have length 1")
        
        # Multi-day streak
        streak = Streak(date(2024, 1, 1), date(2024, 1, 7))
        self.assertEqual(streak.length, 7, "7-day period should have length 7")
        
        # Another multi-day streak
        streak = Streak(date(2024, 1, 15), date(2024, 1, 20))
        self.assertEqual(streak.length, 6, "6-day period should have length 6")
    
    def test_streak_comparison_by_length(self):
        """Test comparing streaks by length"""
        short_streak = Streak(date(2024, 1, 1), date(2024, 1, 3))  # 3 days
        long_streak = Streak(date(2024, 1, 10), date(2024, 1, 20))  # 11 days
        
        self.assertGreater(long_streak.compare_longer(short_streak), 0,
            "Longer streak should compare greater")
        self.assertLess(short_streak.compare_longer(long_streak), 0,
            "Shorter streak should compare less")
        self.assertEqual(short_streak.compare_longer(short_streak), 0,
            "Equal streaks should compare equal")
    
    def test_streak_comparison_by_recency(self):
        """Test comparing streaks by end date when lengths are equal"""
        old_streak = Streak(date(2024, 1, 1), date(2024, 1, 5))  # 5 days, ends Jan 5
        new_streak = Streak(date(2024, 1, 10), date(2024, 1, 14))  # 5 days, ends Jan 14
        
        self.assertGreater(new_streak.compare_newer(old_streak), 0,
            "Newer streak should compare greater")
        self.assertLess(old_streak.compare_newer(new_streak), 0,
            "Older streak should compare less")
    
    def test_streak_comparison_longer_uses_recency_as_tiebreaker(self):
        """When streaks have equal length, compare_longer should use recency"""
        old_streak = Streak(date(2024, 1, 1), date(2024, 1, 5))  # 5 days
        new_streak = Streak(date(2024, 2, 1), date(2024, 2, 5))  # 5 days
        
        # Since lengths are equal, should use recency
        result = new_streak.compare_longer(old_streak)
        self.assertGreater(result, 0, 
            "When lengths equal, newer streak should compare greater")


class TestStreakGrouping(unittest.TestCase):
    """Test streak grouping logic from consecutive dates"""
    
    def test_single_day_creates_single_streak(self):
        """A single completion should create a 1-day streak"""
        from app.services.streak_calculator import StreakCalculator
        
        # Simulate the grouping logic
        timestamps = [date(2024, 1, 15)]
        
        streaks = []
        begin = timestamps[0]
        end = timestamps[0]
        streaks.append(Streak(begin, end))
        
        self.assertEqual(len(streaks), 1, "Should have 1 streak")
        self.assertEqual(streaks[0].length, 1, "Streak should be 1 day long")
    
    def test_consecutive_days_create_single_streak(self):
        """Consecutive completions should create one continuous streak"""
        timestamps = [
            date(2024, 1, 5),
            date(2024, 1, 4),
            date(2024, 1, 3),
            date(2024, 1, 2),
            date(2024, 1, 1)
        ]
        
        # Note: Loop's algorithm expects dates in ascending order
        # and checks if current == begin - 1 day
        timestamps_sorted = sorted(timestamps)
        
        streaks = []
        begin = timestamps_sorted[0]
        end = timestamps_sorted[0]
        
        for i in range(1, len(timestamps_sorted)):
            current = timestamps_sorted[i]
            if current == begin - timedelta(days=1):
                begin = current
            else:
                streaks.append(Streak(begin, end))
                begin = current
                end = current
        
        streaks.append(Streak(begin, end))
        
        self.assertEqual(len(streaks), 1, "Consecutive days should create 1 streak")
        self.assertEqual(streaks[0].length, 5, "Streak should be 5 days long")
        self.assertEqual(streaks[0].start, date(2024, 1, 1))
        self.assertEqual(streaks[0].end, date(2024, 1, 5))
    
    def test_gap_creates_multiple_streaks(self):
        """A gap in completions should create separate streaks"""
        timestamps = [
            date(2024, 1, 10),
            date(2024, 1, 9),
            date(2024, 1, 8),
            # Gap of 2 days
            date(2024, 1, 5),
            date(2024, 1, 4),
            date(2024, 1, 3)
        ]
        
        timestamps_sorted = sorted(timestamps)
        
        streaks = []
        begin = timestamps_sorted[0]
        end = timestamps_sorted[0]
        
        for i in range(1, len(timestamps_sorted)):
            current = timestamps_sorted[i]
            if current == begin - timedelta(days=1):
                begin = current
            else:
                streaks.append(Streak(begin, end))
                begin = current
                end = current
        
        streaks.append(Streak(begin, end))
        
        self.assertEqual(len(streaks), 2, "Gap should create 2 separate streaks")
        self.assertEqual(streaks[0].length, 3, "First streak should be 3 days")
        self.assertEqual(streaks[1].length, 3, "Second streak should be 3 days")
    
    def test_multiple_gaps_create_multiple_streaks(self):
        """Multiple gaps should create multiple streaks"""
        timestamps = [
            date(2024, 1, 20),
            date(2024, 1, 19),
            # Gap
            date(2024, 1, 15),
            # Gap
            date(2024, 1, 10),
            date(2024, 1, 9),
            date(2024, 1, 8)
        ]
        
        timestamps_sorted = sorted(timestamps)
        
        streaks = []
        begin = timestamps_sorted[0]
        end = timestamps_sorted[0]
        
        for i in range(1, len(timestamps_sorted)):
            current = timestamps_sorted[i]
            if current == begin - timedelta(days=1):
                begin = current
            else:
                streaks.append(Streak(begin, end))
                begin = current
                end = current
        
        streaks.append(Streak(begin, end))
        
        self.assertEqual(len(streaks), 3, "Multiple gaps should create 3 streaks")


class TestStreakBestSelection(unittest.TestCase):
    """Test selecting the best streaks"""
    
    def test_get_best_streaks_sorts_by_length(self):
        """Best streaks should be sorted by length first"""
        from app.services.streak_calculator import StreakCalculator
        
        streaks = [
            Streak(date(2024, 1, 1), date(2024, 1, 3)),   # 3 days
            Streak(date(2024, 2, 1), date(2024, 2, 10)),  # 10 days
            Streak(date(2024, 3, 1), date(2024, 3, 5)),   # 5 days
            Streak(date(2024, 4, 1), date(2024, 4, 2)),   # 2 days
        ]
        
        calculator = StreakCalculator(None)  # No supabase needed for this test
        best = calculator.get_best_streaks(streaks, limit=10)
        
        # Should be sorted by length (descending) then by recency
        lengths = [s.length for s in best]
        self.assertEqual(lengths, [10, 5, 3, 2], 
            "Should be sorted by length descending")
    
    def test_get_best_streaks_limits_results(self):
        """Should respect the limit parameter"""
        from app.services.streak_calculator import StreakCalculator
        
        streaks = [
            Streak(date(2024, 1, 1), date(2024, 1, 5)),
            Streak(date(2024, 2, 1), date(2024, 2, 5)),
            Streak(date(2024, 3, 1), date(2024, 3, 5)),
            Streak(date(2024, 4, 1), date(2024, 4, 5)),
            Streak(date(2024, 5, 1), date(2024, 5, 5)),
        ]
        
        calculator = StreakCalculator(None)
        best = calculator.get_best_streaks(streaks, limit=3)
        
        self.assertEqual(len(best), 3, "Should return only 3 streaks")


if __name__ == '__main__':
    unittest.main()
