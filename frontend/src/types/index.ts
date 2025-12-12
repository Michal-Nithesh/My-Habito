/**
 * TypeScript types for Habito
 */

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  locale: string;
  theme: 'light' | 'dark';
  first_day_of_week: number;
  created_at: string;
  updated_at: string;
}

export type HabitType = 'boolean' | 'numerical' | 'duration';
export type TargetType = 'at_least' | 'at_most';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  question?: string;
  habit_type: HabitType;
  target_value?: number;
  target_type?: TargetType;
  unit?: string;
  freq_num: number;
  freq_den: number;
  weekday_schedule: number;
  color: number;
  position: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitWithStats extends Habit {
  total_repetitions: number;
  current_streak: number;
  best_streak: number;
  completion_rate: number;
  last_completion?: string;
}

export interface HabitCreate {
  name: string;
  description?: string;
  question?: string;
  habit_type: HabitType;
  target_value?: number;
  target_type?: TargetType;
  unit?: string;
  freq_num: number;
  freq_den: number;
  weekday_schedule: number;
  color: number;
  position: number;
  archived?: boolean;
}

export interface Repetition {
  id: string;
  habit_id: string;
  user_id: string;
  timestamp: number;
  date: string;
  status: 'completed' | 'skipped' | 'failed' | 'partial';
  value: number;
  completion_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RepetitionCreate {
  habit_id: string;
  timestamp?: number;
  date?: string;
  status?: 'completed' | 'skipped' | 'failed' | 'partial';
  value?: number;
  completion_time?: string;
  notes?: string;
}

export interface Streak {
  id: string;
  habit_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  length: number;
  created_at: string;
  updated_at: string;
}

export interface StreakSummary {
  habit_id: string;
  current_streak: number;
  best_streak: number;
  total_streaks: number;
  streaks: Streak[];
}

export interface Score {
  id: string;
  habit_id: string;
  user_id: string;
  timestamp: number;
  date: string;
  score: number;
  created_at: string;
}

export interface ScoreHistory {
  habit_id: string;
  scores: Score[];
  current_score: number;
  current_score_percentage: number;
}

export interface HabitStatistics {
  habit_id: string;
  habit_name: string;
  total_repetitions: number;
  completion_rate: number;
  current_streak: number;
  best_streak: number;
  average_value?: number;
  last_completion?: string;
  total_days_tracked: number;
}

export interface OverviewStatistics {
  total_habits: number;
  active_habits: number;
  archived_habits: number;
  total_repetitions: number;
  total_repetitions_today: number;
  habits_completed_today: number;
  longest_streak: number;
  average_completion_rate: number;
}

export interface CalendarHeatmapData {
  date: string;
  count: number;
  level: number;
}

export interface WeeklyChartData {
  week_label: string;
  completed: number;
  target: number;
  completion_rate: number;
}

export interface MonthlyChartData {
  month_label: string;
  completed: number;
  target: number;
  completion_rate: number;
}

export interface TrendData {
  period: string;
  consistency_score: number;
  improvement_rate: number;
  average_completion_rate: number;
  best_day_of_week?: string;
  worst_day_of_week?: string;
}

export interface DetailedHabitStatistics {
  habit_id: string;
  habit_name: string;
  total_repetitions: number;
  completion_rate: number;
  current_streak: number;
  best_streak: number;
  average_value?: number;
  last_completion?: string;
  total_days_tracked: number;
  weekly_data: WeeklyChartData[];
  monthly_data: MonthlyChartData[];
  calendar_heatmap: CalendarHeatmapData[];
  trend_data?: TrendData;
}

// Color palette (matching Loop Habit Tracker)
export const HABIT_COLORS = [
  '#D32F2F', // Red
  '#E64A19', // Deep Orange
  '#F57C00', // Orange
  '#F9A825', // Amber
  '#AFB42B', // Lime
  '#689F38', // Light Green
  '#388E3C', // Green
  '#00897B', // Teal
  '#00ACC1', // Cyan
  '#039BE5', // Light Blue
  '#1976D2', // Blue
  '#3949AB', // Indigo
  '#5E35B1', // Deep Purple
  '#8E24AA', // Purple
  '#C2185B', // Pink
  '#D81B60', // Pink
  '#6D4C41', // Brown
  '#546E7A', // Blue Grey
  '#757575', // Grey
  '#303F9F', // Dark Blue
];

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WEEKDAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export interface Reminder {
  id: string;
  habit_id: string;
  user_id: string;
  reminder_time: string;
  days_of_week: number;
  message?: string;
  is_enabled: boolean;
  is_smart: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderCreate {
  habit_id: string;
  reminder_time: string;
  days_of_week?: number;
  message?: string;
  is_enabled?: boolean;
  is_smart?: boolean;
}

export interface NotificationPreferences {
  user_id: string;
  notifications_enabled: boolean;
  daily_summary_enabled: boolean;
  daily_summary_time: string;
  smart_reminders_enabled: boolean;
  smart_reminder_time: string;
  push_enabled: boolean;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  user_id: string;
  habit_id?: string;
  reminder_id?: string;
  notification_type: string;
  title: string;
  body: string;
  sent_at: string;
  was_read: boolean;
  read_at?: string;
}
