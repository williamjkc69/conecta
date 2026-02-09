-- Allow anonymous access for Retell Webhook operations
-- WARNING: This significantly reduces security by making these tables potentially writable by anyone.
-- This is a workaround because the webhook is using the Anonymous client instead of the Service Role Key.
-- A better approach is to use the SUPABASE_SERVICE_ROLE_KEY environment variable.

BEGIN;

-- 1. Allow Anon to READ applications (required to fetch listing_id)
-- Check if policy exists first? Supabase policies don't error on create usually if names diff.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Anon can read applications' AND tablename = 'applications'
    ) THEN
        CREATE POLICY "Anon can read applications" ON applications
          FOR SELECT
          TO anon
          USING (true);
    END IF;
END $$;

-- 2. Allow Anon to UPDATE applications (required to set score/status)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Anon can update applications' AND tablename = 'applications'
    ) THEN
        CREATE POLICY "Anon can update applications" ON applications
          FOR UPDATE
          TO anon
          USING (true)
          WITH CHECK (true);
    END IF;
END $$;

-- 3. Allow Anon to INSERT interview_responses (required for custom questions)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Anon can insert interview_responses' AND tablename = 'interview_responses'
    ) THEN
        CREATE POLICY "Anon can insert interview_responses" ON interview_responses
          FOR INSERT
          TO anon
          WITH CHECK (true);
    END IF;
END $$;

-- 4. Allow Anon to INSERT/UPDATE reports (required for analysis json)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Anon can upsert reports' AND tablename = 'reports'
    ) THEN
        CREATE POLICY "Anon can upsert reports" ON reports
          FOR INSERT
          TO anon
          WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Anon can update reports' AND tablename = 'reports'
    ) THEN
        CREATE POLICY "Anon can update reports" ON reports
          FOR UPDATE
          TO anon
          USING (true);
    END IF;
END $$;

-- Ensure permissions are granted
GRANT SELECT, UPDATE ON applications TO anon;
GRANT INSERT ON interview_responses TO anon;
GRANT INSERT, UPDATE ON reports TO anon;

COMMIT;
