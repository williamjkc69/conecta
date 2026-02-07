-- Allow candidates/users to update their own applications (e.g. interview status, transcript)
-- This fixes the issue where candidates could not start/finish interviews because RLS blocked the status update.

BEGIN;

-- Check if policy exists to avoid error (optional, but good practice if re-running)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'applications'
        AND policyname = 'Users can update their own applications'
    ) THEN
        CREATE POLICY "Users can update their own applications" ON "public"."applications"
          FOR UPDATE
          USING (applications.user_id = public.get_current_user_id());
    END IF;
END
$$;

COMMIT;
