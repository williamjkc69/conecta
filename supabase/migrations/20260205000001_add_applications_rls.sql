-- Migration: Add RLS policies for applications table
-- This allows companies to create applications (invite candidates) and users to view their own applications

BEGIN;

-- Create a helper function to get the current user's company_id
-- This avoids infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_company_id INTEGER;
BEGIN
  SELECT u.company_id INTO user_company_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid();
  
  RETURN user_company_id;
END;
$$;

-- Create a helper function to get the current user's id
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id INTEGER;
BEGIN
  SELECT u.id INTO user_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid();
  
  RETURN user_id;
END;
$$;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Companies can create applications for their listings" ON "public"."applications";
DROP POLICY IF EXISTS "Users can view their own applications" ON "public"."applications";
DROP POLICY IF EXISTS "Companies can view applications for their listings" ON "public"."applications";
DROP POLICY IF EXISTS "Companies can update applications for their listings" ON "public"."applications";
DROP POLICY IF EXISTS "Admins can view all applications" ON "public"."applications";
DROP POLICY IF EXISTS "Admins can update all applications" ON "public"."applications";

-- 1. Companies can insert applications for their own listings
CREATE POLICY "Companies can create applications for their listings" ON "public"."applications"
  FOR INSERT
  WITH CHECK (
    public.get_current_user_role() = 'company'
    AND
    -- The listing must belong to the company of the current user
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = applications.listing_id
        AND l.company_id = public.get_current_user_company_id()
    )
  );

-- 2. Users can view their own applications
CREATE POLICY "Users can view their own applications" ON "public"."applications"
  FOR SELECT
  USING (applications.user_id = public.get_current_user_id());

-- 3. Companies can view applications for their listings
CREATE POLICY "Companies can view applications for their listings" ON "public"."applications"
  FOR SELECT
  USING (
    public.get_current_user_role() = 'company'
    AND
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = applications.listing_id
        AND l.company_id = public.get_current_user_company_id()
    )
  );

-- 4. Companies can update applications for their listings
CREATE POLICY "Companies can update applications for their listings" ON "public"."applications"
  FOR UPDATE
  USING (
    public.get_current_user_role() = 'company'
    AND
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = applications.listing_id
        AND l.company_id = public.get_current_user_company_id()
    )
  );

-- 5. Admins can view all applications
CREATE POLICY "Admins can view all applications" ON "public"."applications"
  FOR SELECT
  USING (public.get_current_user_role() = 'admin');

-- 6. Admins can update all applications
CREATE POLICY "Admins can update all applications" ON "public"."applications"
  FOR UPDATE
  USING (public.get_current_user_role() = 'admin');

COMMIT;

