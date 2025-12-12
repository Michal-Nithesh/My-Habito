"""
Standalone unit tests for Score Calculation Algorithm
Does not require database or external dependencies

Run with: python test_score_algorithm_standalone.py
"""
import math


def compute_score(frequency: float, previous_score: float, checkmark_value: float) -> float:
    """
    Loop Habit Tracker's exact score computation formula
    
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


def test_daily_habit():
    """Test score computation for daily habits (frequency = 1.0)"""
    print("\n=== Testing Daily Habit (frequency = 1.0) ===")
    
    freq = 1.0
    epsilon = 1e-6
    
    tests = [
        # (prev_score, checkmark, expected_result, description)
        (0.0, 1.0, 0.051922, "Score from 0.0 with completion"),
        (0.5, 1.0, 0.525961, "Score from 0.5 with completion"),
        (0.75, 1.0, 0.762981, "Score from 0.75 with completion"),
        (0.0, 0.0, 0.0, "Score from 0.0 without completion"),
        (0.5, 0.0, 0.474039, "Score from 0.5 without completion"),
        (0.75, 0.0, 0.711058, "Score from 0.75 without completion"),
    ]
    
    passed = 0
    failed = 0
    
    for prev_score, checkmark, expected, desc in tests:
        result = compute_score(freq, prev_score, checkmark)
        diff = abs(result - expected)
        
        if diff < epsilon:
            print(f"✓ PASS: {desc}")
            print(f"  Expected: {expected:.6f}, Got: {result:.6f}")
            passed += 1
        else:
            print(f"✗ FAIL: {desc}")
            print(f"  Expected: {expected:.6f}, Got: {result:.6f}, Diff: {diff:.6e}")
            failed += 1
    
    return passed, failed


def test_non_daily_habit():
    """Test score computation for non-daily habits (frequency = 1/3)"""
    print("\n=== Testing Non-Daily Habit (frequency = 1/3) ===")
    
    freq = 1.0 / 3.0
    epsilon = 1e-6
    
    tests = [
        (0.0, 1.0, 0.030314, "Score from 0.0 with completion"),
        (0.5, 1.0, 0.515157, "Score from 0.5 with completion"),
        (0.75, 1.0, 0.757578, "Score from 0.75 with completion"),
        (0.0, 0.0, 0.0, "Score from 0.0 without completion"),
        (0.5, 0.0, 0.484842, "Score from 0.5 without completion"),
        (0.75, 0.0, 0.727263, "Score from 0.75 without completion"),
    ]
    
    passed = 0
    failed = 0
    
    for prev_score, checkmark, expected, desc in tests:
        result = compute_score(freq, prev_score, checkmark)
        diff = abs(result - expected)
        
        if diff < epsilon:
            print(f"✓ PASS: {desc}")
            print(f"  Expected: {expected:.6f}, Got: {result:.6f}")
            passed += 1
        else:
            print(f"✗ FAIL: {desc}")
            print(f"  Expected: {expected:.6f}, Got: {result:.6f}, Diff: {diff:.6e}")
            failed += 1
    
    return passed, failed


def test_score_properties():
    """Test mathematical properties of the score algorithm"""
    print("\n=== Testing Score Properties ===")
    
    passed = 0
    failed = 0
    
    # Test 1: Score is always bounded [0, 1]
    print("\nTest: Score is bounded between 0 and 1")
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
    
    all_bounded = True
    for freq, prev_score, checkmark in test_cases:
        score = compute_score(freq, prev_score, checkmark)
        if not (0.0 <= score <= 1.0):
            print(f"✗ FAIL: Score {score:.6f} out of bounds [0, 1]")
            print(f"  freq={freq}, prev={prev_score}, check={checkmark}")
            all_bounded = False
            failed += 1
    
    if all_bounded:
        print(f"✓ PASS: All scores bounded [0, 1]")
        passed += 1
    
    # Test 2: Completion increases or maintains score
    print("\nTest: Completion increases score")
    all_increase = True
    for freq in [1.0, 0.5, 0.25]:
        for prev_score in [0.0, 0.25, 0.5, 0.75]:
            with_completion = compute_score(freq, prev_score, 1.0)
            without_completion = compute_score(freq, prev_score, 0.0)
            
            if with_completion < without_completion:
                print(f"✗ FAIL: Completion decreased score")
                print(f"  freq={freq}, prev={prev_score}")
                print(f"  with: {with_completion:.6f}, without: {without_completion:.6f}")
                all_increase = False
                failed += 1
                break
    
    if all_increase:
        print(f"✓ PASS: Completion always increases or maintains score")
        passed += 1
    
    # Test 3: Score convergence
    print("\nTest: Score convergence")
    
    # Perfect performance should approach 1.0
    score = 0.0
    for _ in range(100):
        score = compute_score(1.0, score, 1.0)
    
    if score > 0.99:
        print(f"✓ PASS: Perfect performance converges to 1.0 (got {score:.6f})")
        passed += 1
    else:
        print(f"✗ FAIL: Perfect performance should approach 1.0 (got {score:.6f})")
        failed += 1
    
    # No performance should approach 0.0
    score = 1.0
    for _ in range(100):
        score = compute_score(1.0, score, 0.0)
    
    if score < 0.01:
        print(f"✓ PASS: No performance converges to 0.0 (got {score:.6f})")
        passed += 1
    else:
        print(f"✗ FAIL: No performance should approach 0.0 (got {score:.6f})")
        failed += 1
    
    return passed, failed


def test_multiplier_calculation():
    """Test multiplier calculation"""
    print("\n=== Testing Multiplier Calculation ===")
    
    epsilon = 1e-6
    passed = 0
    failed = 0
    
    # For daily habit (freq = 1.0):
    # multiplier = 0.5^(sqrt(1.0) / 13.0) = 0.5^(1/13) ≈ 0.948078
    freq = 1.0
    expected_multiplier = 0.948078
    actual_multiplier = math.pow(0.5, math.sqrt(freq) / 13.0)
    
    if abs(actual_multiplier - expected_multiplier) < epsilon:
        print(f"✓ PASS: Multiplier for daily habit")
        print(f"  Expected: {expected_multiplier:.6f}, Got: {actual_multiplier:.6f}")
        passed += 1
    else:
        print(f"✗ FAIL: Multiplier calculation incorrect")
        print(f"  Expected: {expected_multiplier:.6f}, Got: {actual_multiplier:.6f}")
        failed += 1
    
    # Verify full calculation
    # score = 0.5 * multiplier + 1.0 * (1 - multiplier)
    # score = 0.5 * 0.948078 + 1.0 * (1 - 0.948078)
    # score = 0.474039 + 0.051922 = 0.525961
    score = compute_score(freq, 0.5, 1.0)
    expected_score = 0.525961
    
    if abs(score - expected_score) < epsilon:
        print(f"✓ PASS: Full score calculation")
        print(f"  Expected: {expected_score:.6f}, Got: {score:.6f}")
        passed += 1
    else:
        print(f"✗ FAIL: Full score calculation incorrect")
        print(f"  Expected: {expected_score:.6f}, Got: {score:.6f}")
        failed += 1
    
    return passed, failed


def main():
    """Run all tests"""
    print("=" * 70)
    print("Loop Habit Tracker - Score Algorithm Tests")
    print("Ported from ScoreTest.kt")
    print("=" * 70)
    
    total_passed = 0
    total_failed = 0
    
    # Run all test suites
    p, f = test_daily_habit()
    total_passed += p
    total_failed += f
    
    p, f = test_non_daily_habit()
    total_passed += p
    total_failed += f
    
    p, f = test_multiplier_calculation()
    total_passed += p
    total_failed += f
    
    p, f = test_score_properties()
    total_passed += p
    total_failed += f
    
    # Print summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total Tests: {total_passed + total_failed}")
    print(f"Passed: {total_passed}")
    print(f"Failed: {total_failed}")
    
    if total_failed == 0:
        print("\n🎉 ALL TESTS PASSED! 🎉")
        print("Score algorithm matches Loop Habit Tracker exactly!")
        return 0
    else:
        print(f"\n❌ {total_failed} TEST(S) FAILED")
        return 1


if __name__ == "__main__":
    exit(main())
