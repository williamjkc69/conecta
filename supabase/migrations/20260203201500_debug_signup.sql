-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. COMPLETELY DROP the old function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Define the function with MAXIMUM safety
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
  -- Log start of execution to Postgres logs
  RAISE LOG 'handle_new_user: Starting for user %', NEW.email;

  -- Safe Metadata Extraction
  BEGIN
    If NEW.raw_user_meta_data IS NOT NULL THEN
        v_user_type := COALESCE(NEW.raw_user_meta_data->>'type', 'candidate');
        v_full_name := NEW.raw_user_meta_data->>'full_name';
        v_lastname := NEW.raw_user_meta_data->>'lastname';
        v_doc_number := NEW.raw_user_meta_data->>'document_number';
    END IF;
  EXCEPTION WHEN OTHERS THEN
     RAISE LOG 'handle_new_user: Error extracting metadata: %', SQLERRM;
     -- Continue with defaults
  END;

  -- Role Lookup
  SELECT id INTO v_role_id FROM public.roles WHERE name = v_user_type;
  IF v_role_id IS NULL THEN
      SELECT id INTO v_role_id FROM public.roles WHERE name = 'candidate';
      IF v_role_id IS NULL THEN
         RAISE LOG 'handle_new_user: CRITICAL - No roles found in public.roles table!';
      END IF;
  END IF;

  -- Token Generation
  v_token := encode(gen_random_bytes(32), 'hex');

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
  
  RAISE LOG 'handle_new_user: Successfully created user % (Role ID: %)', NEW.email, v_role_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- The most important line for debugging:
  RAISE LOG 'handle_new_user: FAILED during Execution. Error: %', SQLERRM;
  -- Re-raise to stop auth
  RAISE; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Explicit Permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;
GRANT SELECT ON TABLE public.roles TO service_role;
