"""
Notification Scheduler Service
Handles scheduling and sending of notifications
"""
from datetime import datetime, time, timedelta, date
from typing import List, Dict
from uuid import UUID
from supabase import Client
import asyncio

class NotificationScheduler:
    """
    Service to schedule and send notifications for habit reminders
    """
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    def should_send_reminder(self, reminder: dict, user_id: UUID) -> bool:
        """
        Determine if a reminder should be sent based on day of week and smart logic
        """
        now = datetime.now()
        current_day_bit = 1 << now.weekday()  # 0=Sun, 1=Mon, etc.
        
        # Check if reminder is enabled for today
        if not (reminder["days_of_week"] & current_day_bit):
            return False
        
        # If smart reminder, check if habit is already completed today
        if reminder["is_smart"]:
            habit_id = reminder["habit_id"]
            today = date.today()
            
            # Check for completion today
            completion = self.supabase.table("repetitions") \
                .select("id") \
                .eq("habit_id", habit_id) \
                .eq("user_id", str(user_id)) \
                .eq("date", today.isoformat()) \
                .eq("status", "completed") \
                .execute()
            
            # Don't send if already completed
            if completion.data:
                return False
        
        return True
    
    def get_pending_reminders(self, target_time: time) -> List[dict]:
        """
        Get all reminders that should be sent at the target time
        """
        # Get all enabled reminders with this time
        response = self.supabase.table("reminders") \
            .select("*, habits(name, user_id)") \
            .eq("is_enabled", True) \
            .eq("reminder_time", target_time.isoformat()) \
            .execute()
        
        return response.data or []
    
    def send_reminder_notification(
        self,
        user_id: UUID,
        habit_id: UUID,
        reminder_id: UUID,
        habit_name: str,
        message: str = None
    ) -> bool:
        """
        Send a reminder notification and log it
        """
        try:
            title = f"Reminder: {habit_name}"
            body = message or f"Time to complete your \"{habit_name}\" habit!"
            
            # Create notification history entry
            notification_data = {
                "user_id": str(user_id),
                "habit_id": str(habit_id),
                "reminder_id": str(reminder_id),
                "notification_type": "reminder",
                "title": title,
                "body": body,
                "was_read": False
            }
            
            self.supabase.table("notification_history") \
                .insert(notification_data) \
                .execute()
            
            # TODO: Send actual push notification via Web Push API
            # This would integrate with push notification service
            
            return True
        except Exception as e:
            print(f"Failed to send notification: {e}")
            return False
    
    def send_daily_summary(self, user_id: UUID) -> bool:
        """
        Send daily summary notification
        """
        try:
            # Get user's habits
            habits = self.supabase.table("habits") \
                .select("id, name") \
                .eq("user_id", str(user_id)) \
                .eq("archived", False) \
                .execute()
            
            if not habits.data:
                return False
            
            total_habits = len(habits.data)
            
            # Get today's completions
            today = date.today()
            completions = self.supabase.table("repetitions") \
                .select("habit_id") \
                .eq("user_id", str(user_id)) \
                .eq("date", today.isoformat()) \
                .eq("status", "completed") \
                .execute()
            
            completed_count = len(completions.data) if completions.data else 0
            pending_count = total_habits - completed_count
            
            title = "Daily Habit Summary"
            body = f"You've completed {completed_count}/{total_habits} habits today. "
            if pending_count > 0:
                body += f"{pending_count} habit{'s' if pending_count > 1 else ''} remaining!"
            else:
                body += "Great job! 🎉"
            
            # Create notification
            notification_data = {
                "user_id": str(user_id),
                "notification_type": "daily_summary",
                "title": title,
                "body": body,
                "was_read": False
            }
            
            self.supabase.table("notification_history") \
                .insert(notification_data) \
                .execute()
            
            return True
        except Exception as e:
            print(f"Failed to send daily summary: {e}")
            return False
    
    def check_streak_warnings(self, user_id: UUID) -> List[dict]:
        """
        Check for habits with streaks at risk of breaking
        """
        warnings = []
        today = date.today()
        
        # Get user's active habits
        habits = self.supabase.table("habits") \
            .select("id, name") \
            .eq("user_id", str(user_id)) \
            .eq("archived", False) \
            .execute()
        
        if not habits.data:
            return warnings
        
        for habit in habits.data:
            # Check if completed today
            completion = self.supabase.table("repetitions") \
                .select("id") \
                .eq("habit_id", habit["id"]) \
                .eq("user_id", str(user_id)) \
                .eq("date", today.isoformat()) \
                .execute()
            
            if completion.data:
                continue  # Already completed
            
            # Get current streak
            streaks = self.supabase.table("streaks") \
                .select("length") \
                .eq("habit_id", habit["id"]) \
                .eq("user_id", str(user_id)) \
                .order("length", desc=True) \
                .limit(1) \
                .execute()
            
            if streaks.data and streaks.data[0]["length"] >= 3:
                # Streak of 3+ days is at risk
                warnings.append({
                    "habit_id": habit["id"],
                    "habit_name": habit["name"],
                    "streak_length": streaks.data[0]["length"]
                })
        
        return warnings
    
    def send_streak_warning(self, user_id: UUID, habit_id: UUID, habit_name: str, streak_length: int) -> bool:
        """
        Send a streak warning notification
        """
        try:
            title = f"Streak at Risk! 🔥"
            body = f"Your {streak_length}-day streak for \"{habit_name}\" is about to break. Complete it now!"
            
            notification_data = {
                "user_id": str(user_id),
                "habit_id": str(habit_id),
                "notification_type": "streak_break",
                "title": title,
                "body": body,
                "was_read": False
            }
            
            self.supabase.table("notification_history") \
                .insert(notification_data) \
                .execute()
            
            return True
        except Exception as e:
            print(f"Failed to send streak warning: {e}")
            return False
