-- 1. SIMPLIFY TRIGGER
-- Only creates the user record with role and verification token. 
-- Does NOT attempt to create company or handle complex logic.

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
  -- Extract minimal metadata
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'type', 'candidate');
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_lastname := NEW.raw_user_meta_data->>'lastname';
  v_doc_number := NEW.raw_user_meta_data->>'document_number';
  
  -- Generate token
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Get Role
  SELECT id INTO v_role_id FROM public.roles WHERE name = v_user_type;
  IF v_role_id IS NULL THEN
      SELECT id INTO v_role_id FROM public.roles WHERE name = 'candidate';
  END IF;

  -- Insert minimal user
  INSERT INTO public.users (
      auth_user_id, 
      email, 
      role_id, 
      verification_token,
      name, 
      lastname, 
      document_number, 
      created_at,
      updated_at
  )
  VALUES (
      NEW.id,
      NEW.email,
      v_role_id,
      v_token,
      v_full_name,
      v_lastname,
      v_doc_number,
      now(),
      now()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RAISE; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CREATE STORAGE BUCKET FOR LOGOS
-- Note: 'storage' schema access requires appropriate privileges or extension enablement
-- We insert directly into storage.buckets if it exists
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('company-logos', 'company-logos', true)
    ON CONFLICT (id) DO NOTHING;
    
    -- Policies
    -- 1. Public Read
    BEGIN
        CREATE POLICY "Give public access to company-logos" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    -- 2. Authenticated Insert
    BEGIN
        CREATE POLICY "Enable insert for authenticated users" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    -- 3. Update own
    BEGIN
        CREATE POLICY "Enable update for owners" ON storage.objects FOR UPDATE USING (bucket_id = 'company-logos' AND auth.uid() = owner);
    EXCEPTION WHEN duplicate_object THEN NULL; END;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not configure storage policies automatically: %', SQLERRM;
END $$;
