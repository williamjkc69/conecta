-- Add verified_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('candidate', 'company', 'admin')),
    job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- RLS for invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Allow public to read invitations by token (for checking validity on landing)
CREATE POLICY "Public read access to invitations by token"
ON public.invitations FOR SELECT
TO public
USING (true);

-- Allow companies and admins to insert invitations
CREATE POLICY "Companies and Admins can create invitations"
ON public.invitations FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = company_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow companies to view their own sent invitations
CREATE POLICY "Companies can view their own invitations"
ON public.invitations FOR SELECT
TO authenticated
USING (
    auth.uid() = company_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
