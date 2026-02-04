-- Fix RLS policies for companies table to allow authenticated users to create their company

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own company" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;

-- Enable RLS on companies table (if not already enabled)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to insert a company
-- This allows any authenticated user to create a company record
CREATE POLICY "Users can insert their own company" ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow users to view their own company
-- Users can only see companies they are associated with via the users table
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Policy: Allow users to update their own company
CREATE POLICY "Users can update their own company" ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON companies TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE companies_id_seq TO authenticated;
