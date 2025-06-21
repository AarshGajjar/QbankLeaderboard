-- migration.sql
-- IMPORTANT: Backup your database before running this script!
-- This script assumes the new schema from schema.sql has been applied.

DO $$
DECLARE
    aarsh_user_id UUID;
    aman_user_id UUID;
    default_qbank_id UUID;
BEGIN
    -- Step 0: Configuration - MANUALLY SET THESE UUIDs AFTER CREATING USERS AND CHECKING QBANK
    -- Replace with actual UUIDs from your database by querying your specific instance.
    -- Example of how you might get them (ensure these users/qbank exist first):
    -- SELECT id INTO aarsh_user_id FROM public.profiles WHERE username = 'aarsh@example.com' LIMIT 1;
    -- SELECT id INTO aman_user_id FROM public.profiles WHERE username = 'aman@example.com' LIMIT 1;
    -- SELECT id INTO default_qbank_id FROM public.question_banks WHERE name = 'Default QBank' LIMIT 1;

    -- !!! REPLACE THESE WITH ACTUAL VALUES FROM YOUR DATABASE !!!
    aarsh_user_id := '00000000-0000-0000-0000-000000000001'; -- Placeholder for Aarsh's user ID
    aman_user_id  := '00000000-0000-0000-0000-000000000002'; -- Placeholder for Aman's user ID
    default_qbank_id := '00000000-0000-0000-0000-000000000003'; -- Placeholder for Default QBank ID
    -- !!! END OF PLACEHOLDERS - UPDATE THE ABOVE LINES !!!

    RAISE NOTICE 'Attempting to use Aarsh User ID: %', aarsh_user_id;
    RAISE NOTICE 'Attempting to use Aman User ID: %', aman_user_id;
    RAISE NOTICE 'Attempting to use Default Question Bank ID: %', default_qbank_id;

    -- Verify that the IDs were actually found if you used SELECT INTO
    -- For manually set IDs, this check is more of a safeguard against placeholder use.
    IF aarsh_user_id = '00000000-0000-0000-0000-000000000001' OR aman_user_id = '00000000-0000-0000-0000-000000000002' OR default_qbank_id = '00000000-0000-0000-0000-000000000003' THEN
      RAISE WARNING 'One or more IDs are still placeholders. Please update them with actual UUIDs from your database.';
      -- You might want to RAISE EXCEPTION here to stop the script if placeholders are detected.
      -- RAISE EXCEPTION 'Placeholder UUIDs detected. Update the script before running.';
    END IF;

    -- Check if actual users exist for these IDs to prevent foreign key violations
    PERFORM id FROM public.profiles WHERE id = aarsh_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aarsh profile ID % not found in public.profiles. Please create the user and update the script.', aarsh_user_id;
    END IF;
    PERFORM id FROM public.profiles WHERE id = aman_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aman profile ID % not found in public.profiles. Please create the user and update the script.', aman_user_id;
    END IF;
    PERFORM id FROM public.question_banks WHERE id = default_qbank_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Default Question Bank ID % not found. Please ensure it is seeded and ID is correct.', default_qbank_id;
    END IF;


    -- Step 1: Rename old tables (if they exist and are not yet renamed)
    RAISE NOTICE 'Renaming old tables...';
    EXECUTE 'ALTER TABLE IF EXISTS public.daily_progress RENAME TO old_daily_progress';
    EXECUTE 'ALTER TABLE IF EXISTS public.activity_logs RENAME TO old_activity_logs';
    EXECUTE 'ALTER TABLE IF EXISTS public.qbank_stats RENAME TO old_qbank_stats';
    RAISE NOTICE 'Old tables renaming process complete. Check logs for any errors if tables did not exist.';

    -- Step 2: Migrate data from old_daily_progress to new user_progress table
    RAISE NOTICE 'Migrating daily progress for User 1 (Aarsh)...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'old_daily_progress') THEN
        INSERT INTO public.user_progress (user_id, question_bank_id, date, completed_count, correct_count, created_at, updated_at)
        SELECT
            aarsh_user_id,
            default_qbank_id,
            odp.date::DATE,
            odp.user1_completed,
            odp.user1_correct,
            COALESCE(odp.date::TIMESTAMP WITH TIME ZONE, NOW()),
            COALESCE(odp.date::TIMESTAMP WITH TIME ZONE, NOW())
        FROM old_daily_progress odp
        WHERE odp.user1_completed > 0 OR odp.user1_correct > 0
        ON CONFLICT (user_id, question_bank_id, date) DO NOTHING;
    ELSE
        RAISE WARNING 'Table old_daily_progress does not exist. Skipping Aarsh daily progress migration.';
    END IF;

    RAISE NOTICE 'Migrating daily progress for User 2 (Aman)...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'old_daily_progress') THEN
        INSERT INTO public.user_progress (user_id, question_bank_id, date, completed_count, correct_count, created_at, updated_at)
        SELECT
            aman_user_id,
            default_qbank_id,
            odp.date::DATE,
            odp.user2_completed,
            odp.user2_correct,
            COALESCE(odp.date::TIMESTAMP WITH TIME ZONE, NOW()),
            COALESCE(odp.date::TIMESTAMP WITH TIME ZONE, NOW())
        FROM old_daily_progress odp
        WHERE odp.user2_completed > 0 OR odp.user2_correct > 0
        ON CONFLICT (user_id, question_bank_id, date) DO NOTHING;
    ELSE
        RAISE WARNING 'Table old_daily_progress does not exist. Skipping Aman daily progress migration.';
    END IF;
    RAISE NOTICE 'Daily progress migration complete.';

    -- Step 3: Migrate data from old_activity_logs to new activity_logs table
    RAISE NOTICE 'Migrating activity logs for User 1 (Aarsh)...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'old_activity_logs') THEN
        INSERT INTO public.activity_logs (user_id, question_bank_id, completed_delta, correct_delta, timestamp, created_at)
        SELECT
            aarsh_user_id,
            default_qbank_id,
            oal.completed,
            oal.correct,
            oal.timestamp::TIMESTAMPTZ,
            COALESCE(oal.created_at::TIMESTAMPTZ, oal.timestamp::TIMESTAMPTZ, NOW())
        FROM old_activity_logs oal
        WHERE oal.user_type = 'user1'
        ON CONFLICT DO NOTHING;
    ELSE
        RAISE WARNING 'Table old_activity_logs does not exist. Skipping Aarsh activity log migration.';
    END IF;

    RAISE NOTICE 'Migrating activity logs for User 2 (Aman)...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'old_activity_logs') THEN
        INSERT INTO public.activity_logs (user_id, question_bank_id, completed_delta, correct_delta, timestamp, created_at)
        SELECT
            aman_user_id,
            default_qbank_id,
            oal.completed,
            oal.correct,
            oal.timestamp::TIMESTAMPTZ,
            COALESCE(oal.created_at::TIMESTAMPTZ, oal.timestamp::TIMESTAMPTZ, NOW())
        FROM old_activity_logs oal
        WHERE oal.user_type = 'user2'
        ON CONFLICT DO NOTHING;
    ELSE
        RAISE WARNING 'Table old_activity_logs does not exist. Skipping Aman activity log migration.';
    END IF;
    RAISE NOTICE 'Activity logs migration complete.';

    RAISE NOTICE 'Migration script finished.';
    RAISE NOTICE 'IMPORTANT: Please verify the migrated data thoroughly!';
    RAISE NOTICE 'You may choose to DROP the old_ tables after verification:';
    RAISE NOTICE 'DROP TABLE IF EXISTS old_daily_progress;';
    RAISE NOTICE 'DROP TABLE IF EXISTS old_activity_logs;';
    RAISE NOTICE 'DROP TABLE IF EXISTS old_qbank_stats;';

END $$;
