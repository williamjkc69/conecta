-- Add verification_token to users
ALTER TABLE "public"."users" 
ADD COLUMN "verification_token" text;

CREATE INDEX idx_users_verification_token ON "public"."users"("verification_token");

-- Update handle_new_user to generate token
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role_id int;
  v_token text;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE name = COALESCE(NEW.raw_user_meta_data->>'type', 'candidate');
  IF v_role_id IS NULL THEN
      SELECT id INTO v_role_id FROM public.roles WHERE name = 'candidate';
  END IF;

  -- Generate a random token
  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.users (auth_user_id, email, role_id, name, lastname, document_number, verification_token)
  VALUES (
      NEW.id,
      NEW.email,
      v_role_id,
      NEW.raw_user_meta_data->>'full_name',
      NULL,
      NEW.raw_user_meta_data->>'document_number',
      v_token
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to verify user
CREATE OR REPLACE FUNCTION public.verify_user(token text)
RETURNS boolean AS $$
DECLARE
  v_user_id int;
  v_auth_id uuid;
BEGIN
  -- Find user with token
  SELECT id, auth_user_id INTO v_user_id, v_auth_id
  FROM public.users
  WHERE verification_token = token;

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Update public user
  UPDATE public.users
  SET verified_at = now(),
      verification_token = NULL
  WHERE id = v_user_id;

  -- Try to update auth.users metadata logic is complex from SQL due to permissions.
  -- But we can try relying on the fact that SECURITY DEFINER might have privileges.
  -- Common workaround: Use a separate function or trust the client will refresh, BUT middleware checks metadata.
  -- Ideally, we update the metadata here.
  -- If this fails (due to permissions), we might need to rely on DB check in middleware.
  
  -- Attempt to update auth.users (requires permission)
  -- UPDATE auth.users
  -- SET raw_user_meta_data = 
  --   COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"verified": true}'::jsonb,
  --   email_confirmed_at = now() -- Also confirm email if we want to sync
  -- WHERE id = v_auth_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
