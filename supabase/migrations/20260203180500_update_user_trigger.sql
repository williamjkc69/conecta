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
      NEW.raw_user_meta_data->>'lastname',
      NEW.raw_user_meta_data->>'document_number',
      v_token
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
