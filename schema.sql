-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Disable RLS for the migration process, will be enabled later
ALTER TABLE supabase_migrations DISABLE ROW LEVEL SECURITY;


-- 1. USERS (Profiles)
-- auth.users is managed by Supabase Auth. This table stores additional public profile information.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to auth.users
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.profiles IS 'Profile information for users, extending auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'User ID, references auth.users.id.';

-- Function to create a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email); -- Or use a generated username based on email
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. GROUPS
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.groups IS 'Study groups or teams.';
COMMENT ON COLUMN public.groups.created_by_user_id IS 'The user who created the group.';

CREATE INDEX idx_groups_created_by ON public.groups(created_by_user_id);


-- 3. GROUP MEMBERSHIPS
CREATE TYPE group_role AS ENUM ('admin', 'member');

CREATE TABLE public.group_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role group_role DEFAULT 'member' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (group_id, user_id) -- A user can only be in a group once
);

ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.group_memberships IS 'Tracks which users belong to which groups and their roles.';

CREATE INDEX idx_group_memberships_group_id ON public.group_memberships(group_id);
CREATE INDEX idx_group_memberships_user_id ON public.group_memberships(user_id);


-- 4. QUESTION BANKS
CREATE TABLE public.question_banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.question_banks IS 'Defines different question banks users can track progress against.';

-- Seed a default question bank if none exists (optional, can be handled by application logic)
INSERT INTO public.question_banks (name, description)
SELECT 'Default QBank', 'The default question bank for all users.'
WHERE NOT EXISTS (SELECT 1 FROM public.question_banks WHERE name = 'Default QBank');


-- 5. USER PROGRESS (replaces daily_progress)
CREATE TABLE public.user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_bank_id UUID NOT NULL REFERENCES public.question_banks(id) ON DELETE CASCADE,
    date DATE NOT NULL, -- Store date only, without time component for daily aggregation
    completed_count INT DEFAULT 0 NOT NULL CHECK (completed_count >= 0),
    correct_count INT DEFAULT 0 NOT NULL CHECK (correct_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT correct_not_greater_than_completed CHECK (correct_count <= completed_count),
    UNIQUE (user_id, question_bank_id, date) -- One entry per user, per qbank, per day
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.user_progress IS 'Tracks daily progress for each user on a specific question bank.';

CREATE INDEX idx_user_progress_user_id_date ON public.user_progress(user_id, date);
CREATE INDEX idx_user_progress_question_bank_id ON public.user_progress(question_bank_id);
CREATE INDEX idx_user_progress_date ON public.user_progress(date DESC);


-- 6. ACTIVITY LOGS (replaces current activity_logs)
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_bank_id UUID NOT NULL REFERENCES public.question_banks(id) ON DELETE CASCADE,
    completed_delta INT NOT NULL, -- How many questions were completed in this specific activity
    correct_delta INT NOT NULL,   -- How many were correct in this specific activity
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL, -- Specific time of the activity
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    -- No updated_at as logs are typically immutable
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.activity_logs IS 'Logs individual study sessions or updates for analytics.';
COMMENT ON COLUMN public.activity_logs.completed_delta IS 'Change in completed questions for this event.';
COMMENT ON COLUMN public.activity_logs.correct_delta IS 'Change in correct questions for this event.';

CREATE INDEX idx_activity_logs_user_id_timestamp ON public.activity_logs(user_id, timestamp DESC);
CREATE INDEX idx_activity_logs_question_bank_id ON public.activity_logs(question_bank_id);


-- Function to automatically update_at columns
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables with updated_at
CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_groups
BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_group_memberships
BEFORE UPDATE ON public.group_memberships
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_question_banks
BEFORE UPDATE ON public.question_banks
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_progress
BEFORE UPDATE ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Note: activity_logs does not have an updated_at column by design.

-- Initial RLS Policies (Draft - to be refined and applied in a later step)

-- For public.profiles:
-- Users can view all profiles (if desired, otherwise restrict to their own or group members).
-- Users can only update their own profile.
-- CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
-- CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);


-- For public.groups:
-- Authenticated users can create groups.
-- Group members can view their group's details.
-- Group admins can update/delete their group.
-- CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Group members can view their group" ON public.groups FOR SELECT USING (
--   EXISTS (
--     SELECT 1 FROM public.group_memberships gm
--     WHERE gm.group_id = public.groups.id AND gm.user_id = auth.uid()
--   )
-- );
-- CREATE POLICY "Group admins can update their group" ON public.groups FOR UPDATE USING (
--   EXISTS (
--     SELECT 1 FROM public.group_memberships gm
--     WHERE gm.group_id = public.groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin'
--   )
-- ) WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.group_memberships gm
--     WHERE gm.group_id = public.groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin'
--   )
-- );
-- CREATE POLICY "Group admins can delete their group" ON public.groups FOR DELETE USING (
--   EXISTS (
--     SELECT 1 FROM public.group_memberships gm
--     WHERE gm.group_id = public.groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin'
--   )
-- );


-- For public.group_memberships:
-- Users can view their own memberships.
-- Group admins can manage memberships for their group.
-- Users can join groups (or this is admin-controlled).
-- CREATE POLICY "Users can view their own memberships" ON public.group_memberships FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Group admins can manage memberships" ON public.group_memberships FOR ALL USING (
--   EXISTS (
--     SELECT 1 FROM public.group_memberships gm_admin
--     WHERE gm_admin.group_id = public.group_memberships.group_id AND gm_admin.user_id = auth.uid() AND gm_admin.role = 'admin'
--   )
-- );
-- -- More granular policies might be needed for joining/leaving groups.


-- For public.question_banks:
-- All authenticated users can view question banks.
-- (Optional) Only service_role or specific admin role can create/update/delete question banks.
-- CREATE POLICY "Authenticated users can view question banks" ON public.question_banks FOR SELECT USING (auth.role() = 'authenticated');
-- For admin operations on question_banks, often done via Supabase Studio or a trusted backend role.


-- For public.user_progress:
-- Users can CRUD their own progress.
-- Group members might be able to view progress of others in the same group (for leaderboards/comparisons).
-- CREATE POLICY "Users can manage their own progress" ON public.user_progress FOR ALL
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Group members can view progress within their group" ON public.user_progress FOR SELECT USING (
--   EXISTS (
--     SELECT 1
--     FROM public.group_memberships gm_viewer
--     JOIN public.group_memberships gm_progress_owner
--       ON gm_viewer.group_id = gm_progress_owner.group_id
--     WHERE gm_viewer.user_id = auth.uid()
--       AND gm_progress_owner.user_id = public.user_progress.user_id
--   )
-- );


-- For public.activity_logs:
-- Users can CRUD their own activity logs.
-- Similar to user_progress, group members might view logs of others in the same group.
-- CREATE POLICY "Users can manage their own activity logs" ON public.activity_logs FOR ALL
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Group members can view activity logs within their group" ON public.activity_logs FOR SELECT USING (
--   EXISTS (
--     SELECT 1
--     FROM public.group_memberships gm_viewer
--     JOIN public.group_memberships gm_log_owner
--       ON gm_viewer.group_id = gm_log_owner.group_id
--     WHERE gm_viewer.user_id = auth.uid()
--       AND gm_log_owner.user_id = public.activity_logs.user_id
--   )
-- );

-- Placeholder for old table removal - to be done after successful migration
-- DROP TABLE IF EXISTS public.qbank_stats;
-- DROP TABLE IF EXISTS public.daily_progress;
-- The existing activity_logs table will also need to be handled (migrated then dropped or altered).
-- For now, the new table is named public.activity_logs. If the existing one is also public.activity_logs,
-- we would need to rename the old one before creating the new one, or choose a different name for the new one.
-- Assuming the current one is also public.activity_logs, let's rename it.
-- ALTER TABLE IF EXISTS public.activity_logs RENAME TO old_activity_logs;
-- ALTER TABLE IF EXISTS public.daily_progress RENAME TO old_daily_progress;
-- ALTER TABLE IF EXISTS public.qbank_stats RENAME TO old_qbank_stats;

-- Re-enable RLS that was disabled at the start for migrations
ALTER TABLE supabase_migrations ENABLE ROW LEVEL SECURITY;
