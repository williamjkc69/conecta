-- 1. Ensure extensions schema usage
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. Audit and Fix functions that use extensions or random generation

-- Fix: verify_user (ensure strict search path)
CREATE OR REPLACE FUNCTION public.verify_user(token text)
RETURNS boolean AS $$
DECLARE
  v_user_id int;
BEGIN
  -- Set specific search path to avoid ambiguity
  -- Use explicit table references
  SELECT id INTO v_user_id
  FROM public.users
  WHERE verification_token = token;

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.users
  SET verified_at = now(),
      verification_token = NULL
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- Fix: handle_new_user (ensure strict search path and fallback)
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
  -- Metadata Extraction
  BEGIN
    If NEW.raw_user_meta_data IS NOT NULL THEN
        v_user_type := COALESCE(NEW.raw_user_meta_data->>'type', 'candidate');
        v_full_name := NEW.raw_user_meta_data->>'full_name';
        v_lastname := NEW.raw_user_meta_data->>'lastname';
        v_doc_number := NEW.raw_user_meta_data->>'document_number';
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Role Lookup
  SELECT id INTO v_role_id FROM public.roles WHERE name = v_user_type;
  IF v_role_id IS NULL THEN
      SELECT id INTO v_role_id FROM public.roles WHERE name = 'candidate';
  END IF;

  -- Token Generation (Robust)
  -- Uses extensions.gen_random_bytes if available, else standard uuid
  BEGIN
     -- Try pgcrypto via extensions schema
     v_token := encode(extensions.gen_random_bytes(32), 'hex');
  EXCEPTION WHEN OTHERS THEN
     BEGIN
        -- Try public schema (legacy)
        v_token := encode(public.gen_random_bytes(32), 'hex');
     EXCEPTION WHEN OTHERS THEN
        -- Fallback to built-in UUID md5
        v_token := md5(gen_random_uuid()::text);
     END;
  END;

  INSERT INTO public.users (
      auth_user_id, email, role_id, verification_token,
      name, lastname, document_number
  )
  VALUES (
      NEW.id, NEW.email, v_role_id, v_token,
      COALESCE(v_full_name, 'Unknown'), v_lastname, v_doc_number
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- 3. Check for any other functions (e.g. from restructure_db.sql seed) that might need fixing?
-- Currently only user creation uses random generation.

-- 4. Ensure RLS policies are safe
-- Policies run with user context, usually fine, but 'gen_random_uuid()' is used.
-- 'gen_random_uuid()' is part of pgcrypto pre-v13, but core in v13+.
-- Supabase is v15+. Core 'gen_random_uuid()' is available in 'pg_catalog' which is always in path.
-- BUT if we used 'uuid_generate_v4()', that is strictly 'uuid-ossp' extension.

-- Reviewing restructure_db.sql: It uses 'now()' and 'jsonb_build_object', all core.
-- No other risky function calls found.

-- 5. Grant Permissions Explicitly
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

