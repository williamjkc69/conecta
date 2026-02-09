-- Create helper function to check if listing is active (Security Definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_listing_active(listing_id INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM listings
    WHERE id = listing_id AND status = 'active'
  );
END;
$$;

-- Check if policy exists to avoid error
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'listing_questions'
        AND policyname = 'Anyone can view questions for active listings'
    ) THEN
        CREATE POLICY "Anyone can view questions for active listings" ON listing_questions
          FOR SELECT
          TO anon, authenticated
          USING (
            public.is_listing_active(listing_id)
          );
    END IF;
END
$$;

-- Ensure SELECT permission is granted to anon as well (matching listing_skills pattern)
GRANT SELECT ON listing_questions TO anon;
GRANT EXECUTE ON FUNCTION public.is_listing_active(INT) TO anon, authenticated;

COMMIT;
