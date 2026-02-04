-- Allow authenticated users to update their own company_id in the users table

-- First, let's check if there's a policy that allows users to update their own record
-- If not, we'll create one

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update their own company_id" ON users;

-- Create policy to allow users to update their own company_id
CREATE POLICY "Users can update their own company_id" ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Also ensure users can update their document_number (for candidates)
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Grant UPDATE permission on users table
GRANT UPDATE ON users TO authenticated;
