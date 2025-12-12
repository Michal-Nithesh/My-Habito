-- ============================================
-- HABITO DATABASE SCHEMA
-- PostgreSQL/Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Extended from Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url TEXT,
    locale VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',
    first_day_of_week INTEGER DEFAULT 0, -- 0 = Sunday, 1 = Monday
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HABITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    question VARCHAR(500), -- e.g., "Did you wake up early?"
    
    -- Habit Type
    habit_type VARCHAR(20) NOT NULL DEFAULT 'boolean', -- 'boolean' or 'numerical'
    
    -- Numerical Habit Settings
    target_value DECIMAL(10, 2), -- Target value for numerical habits
    target_type VARCHAR(20), -- 'at_least', 'at_most'
    unit VARCHAR(50), -- e.g., 'minutes', 'glasses', 'km'
    
    -- Frequency Settings
    freq_num INTEGER NOT NULL DEFAULT 1, -- Numerator (e.g., 3 in "3 times per week")
    freq_den INTEGER NOT NULL DEFAULT 1, -- Denominator (e.g., 7 in "3 times per week")
    
    -- Weekly Schedule (bit flags: 0 = inactive, 1 = active)
    -- e.g., 1111111 = all days, 1010101 = Mon/Wed/Fri/Sun
    weekday_schedule INTEGER DEFAULT 127, -- 127 = 1111111 (all days)
    
    -- Visual Settings
    color INTEGER NOT NULL DEFAULT 8, -- Palette color index (0-19)
    position INTEGER NOT NULL DEFAULT 0, -- Sort order
    
    -- Status
    archived BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT habits_user_id_idx FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_habits_archived ON public.habits(archived);
CREATE INDEX idx_habits_position ON public.habits(user_id, position);

-- ============================================
-- REPETITIONS (CHECK-INS) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.repetitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Timestamp (stored as Unix timestamp in milliseconds for compatibility)
    timestamp BIGINT NOT NULL, -- Unix timestamp (milliseconds since epoch)
    date DATE NOT NULL, -- Date for easier querying
    
    -- Value
    value INTEGER NOT NULL DEFAULT 1, -- 1 for boolean habits, actual value for numerical
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one repetition per habit per day
    CONSTRAINT unique_habit_date UNIQUE(habit_id, date)
);

CREATE INDEX idx_repetitions_habit_id ON public.repetitions(habit_id);
CREATE INDEX idx_repetitions_user_id ON public.repetitions(user_id);
CREATE INDEX idx_repetitions_timestamp ON public.repetitions(timestamp);
CREATE INDEX idx_repetitions_date ON public.repetitions(date);

-- ============================================
-- STREAKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Streak Data
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    length INTEGER NOT NULL, -- Number of days in the streak
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_streaks_habit_id ON public.streaks(habit_id);
CREATE INDEX idx_streaks_user_id ON public.streaks(user_id);
CREATE INDEX idx_streaks_end_date ON public.streaks(end_date DESC);

-- ============================================
-- SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Score Data
    timestamp BIGINT NOT NULL, -- Unix timestamp (milliseconds)
    date DATE NOT NULL,
    score INTEGER NOT NULL, -- Score value (0-100000, represents 0.0 to 100.0)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one score per habit per day
    CONSTRAINT unique_habit_score_date UNIQUE(habit_id, date)
);

CREATE INDEX idx_scores_habit_id ON public.scores(habit_id);
CREATE INDEX idx_scores_user_id ON public.scores(user_id);
CREATE INDEX idx_scores_date ON public.scores(date);

-- ============================================
-- REMINDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Reminder Settings
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    minute INTEGER NOT NULL CHECK (minute >= 0 AND minute <= 59),
    days INTEGER NOT NULL DEFAULT 127, -- Bit flags for days (same as weekday_schedule)
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_habit_id ON public.reminders(habit_id);
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);

-- ============================================
-- CHECKMARKS TABLE (Legacy/Optional)
-- For compatibility with Loop Habit Tracker imports
-- ============================================
CREATE TABLE IF NOT EXISTS public.checkmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    value INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checkmarks_habit_id ON public.checkmarks(habit_id);
CREATE INDEX idx_checkmarks_timestamp ON public.checkmarks(timestamp);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repetitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkmarks ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repetitions_updated_at BEFORE UPDATE ON public.repetitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON public.streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View: Current Streaks
CREATE OR REPLACE VIEW current_streaks AS
SELECT 
    h.id as habit_id,
    h.user_id,
    h.name as habit_name,
    s.length as current_streak,
    s.start_date,
    s.end_date
FROM habits h
LEFT JOIN LATERAL (
    SELECT * FROM streaks 
    WHERE habit_id = h.id 
    ORDER BY end_date DESC 
    LIMIT 1
) s ON true
WHERE h.archived = false;

-- View: Habit Statistics
CREATE OR REPLACE VIEW habit_statistics AS
SELECT 
    h.id as habit_id,
    h.user_id,
    h.name,
    COUNT(r.id) as total_repetitions,
    MAX(r.date) as last_completion,
    AVG(CASE WHEN h.habit_type = 'numerical' THEN r.value ELSE NULL END) as avg_value,
    (SELECT length FROM streaks WHERE habit_id = h.id ORDER BY end_date DESC LIMIT 1) as current_streak,
    (SELECT MAX(length) FROM streaks WHERE habit_id = h.id) as best_streak
FROM habits h
LEFT JOIN repetitions r ON h.id = r.habit_id
WHERE h.archived = false
GROUP BY h.id, h.user_id, h.name;

-- ============================================
-- SEED DATA (Optional - for development)
-- ============================================

-- Example: Insert a test user profile
-- INSERT INTO public.user_profiles (id, username, display_name)
-- VALUES ('your-user-uuid', 'testuser', 'Test User');
