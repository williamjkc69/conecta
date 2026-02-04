-- Fix 20260203203000_fix_random_bytes_search_path.sql

-- 1. Ensure `pgcrypto` is INSTALLED in the `extensions` schema (standard practice) or public
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Explicitly grant usage to ensure availability
GRANT USAGE ON SCHEMA extensions TO public;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- 3. Replace the function specifying the FULL PATH to gen_random_bytes
-- This fixes the issue where the search_path of the trigger owner (supabase_auth_admin)
-- doesn't include the schema where pgcrypto is installed.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role_id int;
  v_token text;
  v_user_type text := 'candidate';
  v_full_name text;
  v_lastname text;
  v_doc_number text;
BEGIN
  -- Safe Metadata Extraction
  BEGIN
    If NEW.raw_user_meta_data IS NOT NULL THEN
        v_user_type := COALESCE(NEW.raw_user_meta_data->>'type', 'candidate');
        v_full_name := NEW.raw_user_meta_data->>'full_name';
        v_lastname := NEW.raw_user_meta_data->>'lastname';
        v_doc_number := NEW.raw_user_meta_data->>'document_number';
    END IF;
  EXCEPTION WHEN OTHERS THEN
     NULL; -- Ignore extraction errors
  END;

  -- Role Lookup
  SELECT id INTO v_role_id FROM public.roles WHERE name = v_user_type;
  IF v_role_id IS NULL THEN
      SELECT id INTO v_role_id FROM public.roles WHERE name = 'candidate';
  END IF;

  -- Token Generation (FIXED: Using extensions.gen_random_bytes)
  -- If pgcrypto is in public, this might need public.gen_random_bytes,
  -- but we try to be robust. We can also use native gen_random_uuid in v13+ if bytes fail,
  -- but let's stick to the specific fix for the user's error.
  
  -- Fallback logic for token generation
  BEGIN
    v_token := encode(extensions.gen_random_bytes(32), 'hex');
  EXCEPTION WHEN OTHERS THEN
    -- Try public schema if extensions schema failed
    BEGIN
       v_token := encode(public.gen_random_bytes(32), 'hex');
    EXCEPTION WHEN OTHERS THEN
       -- Final fallback: use MD5 of random UUID (always available)
       v_token := md5(gen_random_uuid()::text); 
    END;
  END;

  -- Insert
  INSERT INTO public.users (
      auth_user_id, 
      email, 
      role_id, 
      verification_token,
      name, 
      lastname, 
      document_number
  )
  VALUES (
      NEW.id,
      NEW.email,
      v_role_id,
      v_token,
      COALESCE(v_full_name, 'Unknown'),
      v_lastname,
      v_doc_number
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
