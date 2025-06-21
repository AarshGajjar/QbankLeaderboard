-- rls_policies.sql
-- Ensure RLS is enabled on all tables (should have been done in schema.sql)
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's ID (already exists from Supabase, auth.uid())
-- Helper function to check if a user is a member of a specific group
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_memberships gm
    WHERE gm.group_id = p_group_id AND gm.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a user is an admin of a specific group
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_memberships gm
    WHERE gm.group_id = p_group_id AND gm.user_id = p_user_id AND gm.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. PROFILES (public.profiles)
-- Policies are applied after RLS is enabled on the table.

-- Allow users to see their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to view other user profiles (e.g., for group member lists)
-- This is a common requirement. Adjust if more restrictive access is needed.
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Inserts are handled by a trigger from auth.users.
-- Deletes are handled by cascade from auth.users.


-- 2. GROUPS (public.groups)

-- Authenticated users can create new groups
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by_user_id); -- Creator must be the authenticated user

-- Group members can view details of groups they belong to
CREATE POLICY "Group members can view their groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (public.is_group_member(id, auth.uid()));

-- Group admins can update their group's details
CREATE POLICY "Group admins can update their groups"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (public.is_group_admin(id, auth.uid()))
  WITH CHECK (public.is_group_admin(id, auth.uid()));

-- Group admins can delete their groups
CREATE POLICY "Group admins can delete their groups"
  ON public.groups FOR DELETE
  TO authenticated
  USING (public.is_group_admin(id, auth.uid()));


-- 3. GROUP MEMBERSHIPS (public.group_memberships)

-- Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
  ON public.group_memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Group members can view other memberships within their common groups
CREATE POLICY "Group members can view other memberships in their groups"
  ON public.group_memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_memberships gm_viewer
      WHERE gm_viewer.group_id = public.group_memberships.group_id AND gm_viewer.user_id = auth.uid()
    )
  );

-- Group admins can add new members to their group
CREATE POLICY "Group admins can add members to their group"
  ON public.group_memberships FOR INSERT
  TO authenticated
  WITH CHECK (public.is_group_admin(group_id, auth.uid()));

-- Group admins can update member roles or remove members (delete) from their group
CREATE POLICY "Group admins can manage members in their group"
  ON public.group_memberships FOR UPDATE -- For changing roles
  TO authenticated
  USING (public.is_group_admin(group_id, auth.uid()))
  WITH CHECK (public.is_group_admin(group_id, auth.uid()));

CREATE POLICY "Group admins can remove members from their group"
  ON public.group_memberships FOR DELETE
  TO authenticated
  USING (public.is_group_admin(group_id, auth.uid()));

-- Users can leave a group (delete their own membership), but not if they are the sole admin.
-- This requires a more complex check, often better handled by a dedicated DB function or application logic.
-- Simple version: Allow users to delete their own membership.
CREATE POLICY "Users can leave groups (delete their own membership)"
  ON public.group_memberships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
  -- Add a check to prevent sole admin from leaving in a real scenario:
  -- WITH CHECK (NOT (role = 'admin' AND (SELECT COUNT(*) FROM public.group_memberships WHERE group_id = gm.group_id AND role = 'admin') = 1))
  -- This check is complex for RLS and might be better as a BEFORE DELETE trigger or an RPC function.

-- 4. QUESTION BANKS (public.question_banks)

-- All authenticated users can read question banks
CREATE POLICY "Authenticated users can view question banks"
  ON public.question_banks FOR SELECT
  TO authenticated
  USING (true);

-- For CUD operations on question_banks, typically restrict to service_role or specific admin UI.
-- Example: Allow service_role full access (often default if no other policies match for service_role)
-- CREATE POLICY "Admins can manage question banks"
--   ON public.question_banks FOR ALL
--   USING (auth.role() = 'service_role'); -- Or a custom admin role


-- 5. USER PROGRESS (public.user_progress)

-- Users can manage (CRUD) their own progress records
CREATE POLICY "Users can manage their own progress"
  ON public.user_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Group members can view progress of other users within the same group
CREATE POLICY "Group members can view progress within their group"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_memberships gm_viewer
      JOIN public.group_memberships gm_progress_owner -- Find the owner of the progress
        ON gm_viewer.group_id = gm_progress_owner.group_id
      WHERE gm_viewer.user_id = auth.uid() -- The viewer is a member of the group
        AND gm_progress_owner.user_id = public.user_progress.user_id -- The progress owner is also a member of that same group
    )
  );


-- 6. ACTIVITY LOGS (public.activity_logs)

-- Users can create their own activity logs
CREATE POLICY "Users can create their own activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Group members can view activity logs of other users within the same group (optional, for detailed analytics)
CREATE POLICY "Group members can view activity logs within their group"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_memberships gm_viewer
      JOIN public.group_memberships gm_log_owner -- Find the owner of the log
        ON gm_viewer.group_id = gm_log_owner.group_id
      WHERE gm_viewer.user_id = auth.uid() -- The viewer is a member of the group
        AND gm_log_owner.user_id = public.activity_logs.user_id -- The log owner is also a member of that same group
    )
  );

-- Generally, logs are immutable, so no UPDATE or DELETE policies for users.
-- Admin/Service role might have them.

RAISE NOTICE 'RLS policies script completed. Review and test thoroughly.';
