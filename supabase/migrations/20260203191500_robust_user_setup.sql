-- Ensure pgcrypto is available for gen_random_bytes (usually core in v13+ but good practice)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Clean up potential legacy triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function to recreate it cleanly
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Recreate the function with robust logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role_id int;
  v_token text;
  v_user_type text;
  v_full_name text;
  v_lastname text;
  v_doc_number text;
BEGIN
  -- Extract metadata safely
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'type', 'candidate');
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_lastname := NEW.raw_user_meta_data->>'lastname';
  v_doc_number := NEW.raw_user_meta_data->>'document_number';

  -- Find Role ID
  SELECT id INTO v_role_id FROM public.roles WHERE name = v_user_type;
  
  -- Fallback to candidate if specific role not found
  IF v_role_id IS NULL THEN
      SELECT id INTO v_role_id FROM public.roles WHERE name = 'candidate';
  END IF;

  -- Generate valid token
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Insert new user
  INSERT INTO public.users (
      auth_user_id, 
      email, 
      role_id, 
      name, 
      lastname, 
      document_number, 
      verification_token,
      created_at,
      updated_at
  )
  VALUES (
      NEW.id,
      NEW.email,
      v_role_id,
      v_full_name,
      v_lastname,
      v_doc_number,
      v_token,
      now(),
      now()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error (visible in Supabase logs) and re-raise to block auth creation
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Ensure Permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;
