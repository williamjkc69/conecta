-- Update handle_new_user to save both full_name and lastname from metadata
-- document_number will still be collected later for candidates only

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role_id int;
  v_token text;
  v_user_type text := 'candidate';
  v_full_name text;
  v_lastname text;
BEGIN
  -- Metadata Extraction
  BEGIN
    If NEW.raw_user_meta_data IS NOT NULL THEN
        v_user_type := COALESCE(NEW.raw_user_meta_data->>'type', 'candidate');
        v_full_name := NEW.raw_user_meta_data->>'full_name';
        v_lastname := NEW.raw_user_meta_data->>'lastname';
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Role Lookup
  SELECT id INTO v_role_id FROM public.roles WHERE name = v_user_type;
  IF v_role_id IS NULL THEN
      SELECT id INTO v_role_id FROM public.roles WHERE name = 'candidate';
  END IF;

  -- Token Generation (Robust)
  BEGIN
     v_token := encode(extensions.gen_random_bytes(32), 'hex');
  EXCEPTION WHEN OTHERS THEN
     BEGIN
        v_token := encode(public.gen_random_bytes(32), 'hex');
     EXCEPTION WHEN OTHERS THEN
        v_token := md5(gen_random_uuid()::text);
     END;
  END;

  -- Insert user data with name and lastname
  -- document_number will be NULL initially and filled during candidate onboarding
  INSERT INTO public.users (
      auth_user_id, 
      email, 
      role_id, 
      verification_token,
      name,
      lastname
  )
  VALUES (
      NEW.id, 
      NEW.email, 
      v_role_id, 
      v_token,
      COALESCE(v_full_name, 'Unknown'),
      v_lastname
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;
