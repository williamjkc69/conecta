-- Fix RLS policies for listings table to allow companies to create job listings

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies can insert their own listings" ON listings;
DROP POLICY IF EXISTS "Companies can view their own listings" ON listings;
DROP POLICY IF EXISTS "Companies can update their own listings" ON listings;
DROP POLICY IF EXISTS "Companies can delete their own listings" ON listings;
DROP POLICY IF EXISTS "Anyone can view active listings" ON listings;

-- Enable RLS on listings table (if not already enabled)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users (companies) to insert listings
CREATE POLICY "Companies can insert their own listings" ON listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Policy: Allow companies to view their own listings
CREATE POLICY "Companies can view their own listings" ON listings
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Policy: Allow anyone (including unauthenticated) to view active listings
CREATE POLICY "Anyone can view active listings" ON listings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Policy: Allow companies to update their own listings
CREATE POLICY "Companies can update their own listings" ON listings
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Policy: Allow companies to delete their own listings
CREATE POLICY "Companies can delete their own listings" ON listings
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON listings TO authenticated;
GRANT SELECT ON listings TO anon;
GRANT USAGE, SELECT ON SEQUENCE listings_id_seq TO authenticated;
