-- Migration: Allow companies to search for candidates
-- This enables the "Invitar Candidato" modal search functionality

BEGIN;

-- Create a security definer function to get the current user's role
-- This avoids infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT r.name INTO user_role
  FROM public.users u
  INNER JOIN public.roles r ON u.role_id = r.id
  WHERE u.auth_user_id = auth.uid();
  
  RETURN user_role;
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view self" ON "public"."users";
DROP POLICY IF EXISTS "Companies can search candidates" ON "public"."users";
DROP POLICY IF EXISTS "Admins can view all users" ON "public"."users";

-- Create new policies using the helper function:

-- 1. Users can view themselves
CREATE POLICY "Users can view self" ON "public"."users"
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- 2. Company users can search for candidates
CREATE POLICY "Companies can search candidates" ON "public"."users"
  FOR SELECT
  USING (
    public.get_current_user_role() = 'company'
    AND
    EXISTS (
      SELECT 1 FROM public.roles
      WHERE roles.id = users.role_id
        AND roles.name = 'candidate'
    )
  );

-- 3. Admin users can view all users
CREATE POLICY "Admins can view all users" ON "public"."users"
  FOR SELECT
  USING (public.get_current_user_role() = 'admin');

COMMIT;
