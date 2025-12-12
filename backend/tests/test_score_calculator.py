"""
Unit tests for Score Calculator
Ported from Loop Habit Tracker's ScoreTest.kt

These tests verify that the score calculation algorithm matches
Loop Habit Tracker's exact behavior.
"""
import unittest
import math
from app.services.score_calculator import ScoreCalculator


class TestScoreCompute(unittest.TestCase):
    """Test the core score computation formula"""
    
    E = 1e-6  # Epsilon for floating point comparison
    
    def assertAlmostEqualWithE(self, actual, expected, msg=None):
        """Assert that two floats are equal within epsilon E"""
        self.assertAlmostEqual(actual, expected, delta=self.E, msg=msg)
    
    def test_compute_with_daily_habit(self):
        """Test score computation for daily habits (frequency = 1.0)"""
        check = 1
        freq = 1.0
        
        # Test with checkmark = 1 (completed)
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.0, float(check)),
            0.051922,
            "Daily habit: score from 0.0 with check"
        )
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.5, float(check)),
            0.525961,
            "Daily habit: score from 0.5 with check"
        )
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.75, float(check)),
            0.762981,
            "Daily habit: score from 0.75 with check"
        )
        
        # Test with checkmark = 0 (not completed)
        check = 0
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.0, float(check)),
            0.0,
            "Daily habit: score from 0.0 without check"
        )
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.5, float(check)),
            0.474039,
            "Daily habit: score from 0.5 without check"
        )
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.75, float(check)),
            0.711058,
            "Daily habit: score from 0.75 without check"
        )
    
    def test_compute_with_non_daily_habit(self):
        """Test score computation for non-daily habits (frequency = 1/3)"""
        check = 1
        freq = 1.0 / 3.0
        
        # Test with checkmark = 1 (completed)
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.0, float(check)),
            0.030314,
            "Non-daily habit: score from 0.0 with check"
        )
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.5, float(check)),
            0.515157,
            "Non-daily habit: score from 0.5 with check"
        )
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.75, float(check)),
            0.757578,
            "Non-daily habit: score from 0.75 with check"
        )
        
        # Test with checkmark = 0 (not completed)
        check = 0
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.0, float(check)),
            0.0,
            "Non-daily habit: score from 0.0 without check"
        )
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.5, float(check)),
            0.484842,
            "Non-daily habit: score from 0.5 without check"
        )
        self.assertAlmostEqualWithE(
            ScoreCalculator.compute(freq, 0.75, float(check)),
            0.727263,
            "Non-daily habit: score from 0.75 without check"
        )
    
    def test_multiplier_calculation(self):
        """Test that the multiplier is calculated correctly"""
        # For daily habit (freq = 1.0):
        # multiplier = 0.5^(sqrt(1.0) / 13.0) = 0.5^(1/13) ≈ 0.948078
        freq = 1.0
        expected_multiplier = math.pow(0.5, math.sqrt(freq) / 13.0)
        self.assertAlmostEqualWithE(expected_multiplier, 0.948078)
        
        # Verify score calculation uses this multiplier
        # score = 0.5 * multiplier + 1.0 * (1 - multiplier)
        # score = 0.5 * 0.948078 + 1.0 * (1 - 0.948078)
        # score = 0.474039 + 0.051922 = 0.525961
        score = ScoreCalculator.compute(freq, 0.5, 1.0)
        self.assertAlmostEqualWithE(score, 0.525961)
    
    def test_score_convergence(self):
        """Test that scores converge to expected values"""
        freq = 1.0  # Daily habit
        
        # With perfect performance, score should approach 1.0
        score = 0.0
        for _ in range(100):
            score = ScoreCalculator.compute(freq, score, 1.0)
        self.assertGreater(score, 0.99, "Perfect performance should approach 1.0")
        
        # With no performance, score should approach 0.0
        score = 1.0
        for _ in range(100):
            score = ScoreCalculator.compute(freq, score, 0.0)
        self.assertLess(score, 0.01, "No performance should approach 0.0")


class TestScoreAlgorithmProperties(unittest.TestCase):
    """Test mathematical properties of the score algorithm"""
    
    def test_score_is_bounded(self):
        """Score should always be between 0 and 1"""
        test_cases = [
            (1.0, 0.0, 0.0),
            (1.0, 0.0, 1.0),
            (1.0, 0.5, 0.0),
            (1.0, 0.5, 1.0),
            (1.0, 1.0, 0.0),
            (1.0, 1.0, 1.0),
            (0.5, 0.3, 0.7),
            (0.1, 0.8, 0.2),
        ]
        
        for freq, prev_score, checkmark in test_cases:
            score = ScoreCalculator.compute(freq, prev_score, checkmark)
            self.assertGreaterEqual(score, 0.0, 
                f"Score should be >= 0: freq={freq}, prev={prev_score}, check={checkmark}")
            self.assertLessEqual(score, 1.0,
                f"Score should be <= 1: freq={freq}, prev={prev_score}, check={checkmark}")
    
    def test_score_increases_with_completion(self):
        """Completing a habit should increase or maintain the score"""
        frequencies = [1.0, 0.5, 0.25, 0.1]
        previous_scores = [0.0, 0.25, 0.5, 0.75, 1.0]
        
        for freq in frequencies:
            for prev_score in previous_scores:
                score_with_completion = ScoreCalculator.compute(freq, prev_score, 1.0)
                score_without_completion = ScoreCalculator.compute(freq, prev_score, 0.0)
                
                self.assertGreaterEqual(score_with_completion, score_without_completion,
                    f"Completion should increase score: freq={freq}, prev={prev_score}")
    
    def test_higher_frequency_gives_smaller_change(self):
        """Higher frequency habits should have smaller per-day score changes"""
        # Daily habit (freq = 1.0) vs weekly habit (freq = 1/7)
        daily_change = ScoreCalculator.compute(1.0, 0.5, 1.0) - 0.5
        weekly_change = ScoreCalculator.compute(1.0/7.0, 0.5, 1.0) - 0.5
        
        # Weekly habit should have smaller change per day
        self.assertLess(weekly_change, daily_change,
            "Weekly habit should have smaller per-day score change than daily habit")


if __name__ == '__main__':
    unittest.main()
