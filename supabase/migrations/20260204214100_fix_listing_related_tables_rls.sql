-- Fix RLS policies for listing_skills and listing_questions tables

-- ============================================
-- LISTING_SKILLS TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies can insert skills for their listings" ON listing_skills;
DROP POLICY IF EXISTS "Companies can view skills for their listings" ON listing_skills;
DROP POLICY IF EXISTS "Companies can delete skills from their listings" ON listing_skills;
DROP POLICY IF EXISTS "Anyone can view skills for active listings" ON listing_skills;

-- Enable RLS
ALTER TABLE listing_skills ENABLE ROW LEVEL SECURITY;

-- Policy: Allow companies to insert skills for their own listings
CREATE POLICY "Companies can insert skills for their listings" ON listing_skills
  FOR INSERT
  TO authenticated
  WITH CHECK (
    listing_id IN (
      SELECT l.id 
      FROM listings l
      JOIN users u ON l.company_id = u.company_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Policy: Allow companies to view skills for their own listings
CREATE POLICY "Companies can view skills for their listings" ON listing_skills
  FOR SELECT
  TO authenticated
  USING (
    listing_id IN (
      SELECT l.id 
      FROM listings l
      JOIN users u ON l.company_id = u.company_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Policy: Allow anyone to view skills for active listings
CREATE POLICY "Anyone can view skills for active listings" ON listing_skills
  FOR SELECT
  TO anon, authenticated
  USING (
    listing_id IN (
      SELECT id FROM listings WHERE status = 'active'
    )
  );

-- Policy: Allow companies to delete skills from their own listings
CREATE POLICY "Companies can delete skills from their listings" ON listing_skills
  FOR DELETE
  TO authenticated
  USING (
    listing_id IN (
      SELECT l.id 
      FROM listings l
      JOIN users u ON l.company_id = u.company_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON listing_skills TO authenticated;
GRANT SELECT ON listing_skills TO anon;

-- ============================================
-- LISTING_QUESTIONS TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies can insert questions for their listings" ON listing_questions;
DROP POLICY IF EXISTS "Companies can view questions for their listings" ON listing_questions;
DROP POLICY IF EXISTS "Companies can update questions for their listings" ON listing_questions;
DROP POLICY IF EXISTS "Companies can delete questions from their listings" ON listing_questions;

-- Enable RLS
ALTER TABLE listing_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow companies to insert questions for their own listings
CREATE POLICY "Companies can insert questions for their listings" ON listing_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    listing_id IN (
      SELECT l.id 
      FROM listings l
      JOIN users u ON l.company_id = u.company_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Policy: Allow companies to view questions for their own listings
CREATE POLICY "Companies can view questions for their listings" ON listing_questions
  FOR SELECT
  TO authenticated
  USING (
    listing_id IN (
      SELECT l.id 
      FROM listings l
      JOIN users u ON l.company_id = u.company_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Policy: Allow companies to update questions for their own listings
CREATE POLICY "Companies can update questions for their listings" ON listing_questions
  FOR UPDATE
  TO authenticated
  USING (
    listing_id IN (
      SELECT l.id 
      FROM listings l
      JOIN users u ON l.company_id = u.company_id
      WHERE u.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT l.id 
      FROM listings l
      JOIN users u ON l.company_id = u.company_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Policy: Allow companies to delete questions from their own listings
CREATE POLICY "Companies can delete questions from their listings" ON listing_questions
  FOR DELETE
  TO authenticated
  USING (
    listing_id IN (
      SELECT l.id 
      FROM listings l
      JOIN users u ON l.company_id = u.company_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON listing_questions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE listing_questions_id_seq TO authenticated;

-- ============================================
-- SKILLS TABLE (for auto-creation)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view skills" ON skills;
DROP POLICY IF EXISTS "Authenticated users can insert skills" ON skills;

-- Enable RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to view skills
CREATE POLICY "Anyone can view skills" ON skills
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Allow authenticated users to insert new skills
CREATE POLICY "Authenticated users can insert skills" ON skills
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON skills TO authenticated;
GRANT SELECT ON skills TO anon;
GRANT USAGE, SELECT ON SEQUENCE skills_id_seq TO authenticated;
