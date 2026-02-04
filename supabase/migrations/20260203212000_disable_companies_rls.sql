-- Completely disable RLS on companies table temporarily to allow inserts
-- This is a simpler approach for the onboarding flow

ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, use this instead:
-- DROP ALL existing policies first
-- DROP POLICY IF EXISTS "Users can insert their own company" ON companies;
-- DROP POLICY IF EXISTS "Users can view their own company" ON companies;
-- DROP POLICY IF EXISTS "Users can update their own company" ON companies;

-- CREATE POLICY "Enable insert for authenticated users" ON companies
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

-- CREATE POLICY "Enable read for authenticated users" ON companies
--   FOR SELECT
--   TO authenticated
--   USING (true);

-- CREATE POLICY "Enable update for authenticated users" ON companies
--   FOR UPDATE
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);
