-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repetitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can create their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can update their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can delete their own habits" ON public.habits;

DROP POLICY IF EXISTS "Users can view their own repetitions" ON public.repetitions;
DROP POLICY IF EXISTS "Users can create their own repetitions" ON public.repetitions;
DROP POLICY IF EXISTS "Users can update their own repetitions" ON public.repetitions;
DROP POLICY IF EXISTS "Users can delete their own repetitions" ON public.repetitions;

DROP POLICY IF EXISTS "Users can view their own streaks" ON public.streaks;
DROP POLICY IF EXISTS "Users can create their own streaks" ON public.streaks;
DROP POLICY IF EXISTS "Users can update their own streaks" ON public.streaks;
DROP POLICY IF EXISTS "Users can delete their own streaks" ON public.streaks;

DROP POLICY IF EXISTS "Users can view their own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can create their own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can update their own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can delete their own scores" ON public.scores;

DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can create their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminders;

DROP POLICY IF EXISTS "Users can view their own checkmarks" ON public.checkmarks;
DROP POLICY IF EXISTS "Users can create their own checkmarks" ON public.checkmarks;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Habits Policies
CREATE POLICY "Users can view their own habits" ON public.habits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits" ON public.habits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" ON public.habits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" ON public.habits
    FOR DELETE USING (auth.uid() = user_id);

-- Repetitions Policies
CREATE POLICY "Users can view their own repetitions" ON public.repetitions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own repetitions" ON public.repetitions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repetitions" ON public.repetitions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repetitions" ON public.repetitions
    FOR DELETE USING (auth.uid() = user_id);

-- Streaks Policies
CREATE POLICY "Users can view their own streaks" ON public.streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own streaks" ON public.streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON public.streaks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks" ON public.streaks
    FOR DELETE USING (auth.uid() = user_id);

-- Scores Policies
CREATE POLICY "Users can view their own scores" ON public.scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scores" ON public.scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores" ON public.scores
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scores" ON public.scores
    FOR DELETE USING (auth.uid() = user_id);

-- Reminders Policies
CREATE POLICY "Users can view their own reminders" ON public.reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders" ON public.reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" ON public.reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON public.reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Checkmarks Policies
CREATE POLICY "Users can view their own checkmarks" ON public.checkmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checkmarks" ON public.checkmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
