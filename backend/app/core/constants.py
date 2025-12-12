"""
Entry Constants
Matching Loop Habit Tracker's Entry.kt values

These constants define the possible values for habit repetitions/checkmarks.
"""

# Entry value constants matching Loop Habit Tracker
# Value indicating that the user is not expected to perform the habit on this day
# (due to the habit's schedule/frequency)
ENTRY_YES_AUTO = 1

# Value indicating that the user has manually performed the habit at this timestamp
ENTRY_YES_MANUAL = 2

# Value indicating that the habit is not applicable for this timestamp
# (user explicitly skipped)
ENTRY_SKIP = 3

# Value indicating that the user did not perform the habit,
# even though they were expected to perform it
ENTRY_NO = 0

# Value indicating that no data is available for the given timestamp
ENTRY_UNKNOWN = -1


def get_entry_name(value: int) -> str:
    """Get human-readable name for entry value"""
    mapping = {
        ENTRY_YES_MANUAL: "YES_MANUAL",
        ENTRY_YES_AUTO: "YES_AUTO",
        ENTRY_NO: "NO",
        ENTRY_SKIP: "SKIP",
        ENTRY_UNKNOWN: "UNKNOWN"
    }
    return mapping.get(value, str(value))


def next_toggle_value(
    value: int,
    is_skip_enabled: bool = True,
    are_question_marks_enabled: bool = True
) -> int:
    """
    Calculate the next value when toggling an entry
    
    Args:
        value: Current entry value
        is_skip_enabled: Whether skip option is enabled
        are_question_marks_enabled: Whether unknown/question marks are enabled
    
    Returns:
        Next entry value in toggle sequence
    """
    if value == ENTRY_YES_AUTO:
        return ENTRY_YES_MANUAL
    elif value == ENTRY_YES_MANUAL:
        return ENTRY_SKIP if is_skip_enabled else ENTRY_NO
    elif value == ENTRY_SKIP:
        return ENTRY_NO
    elif value == ENTRY_NO:
        return ENTRY_UNKNOWN if are_question_marks_enabled else ENTRY_YES_MANUAL
    elif value == ENTRY_UNKNOWN:
        return ENTRY_YES_MANUAL
    else:
        return ENTRY_YES_MANUAL
