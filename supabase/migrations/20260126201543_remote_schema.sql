drop extension if exists "pg_net";


  create table "public"."applications" (
    "id" uuid not null default gen_random_uuid(),
    "candidate_id" uuid not null,
    "job_id" uuid not null,
    "company_id" uuid not null,
    "status" text not null,
    "applied_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "call_id" text,
    "duration" double precision,
    "recording_url" text,
    "retell_llm_response_data" jsonb,
    "interview_scheduled_at" timestamp with time zone,
    "interview_status" text default 'pending'::text,
    "transcript" jsonb
      );


alter table "public"."applications" enable row level security;


  create table "public"."jobs" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "title" text not null,
    "description" text,
    "location" text,
    "type" text,
    "salary" text,
    "requirements" text[],
    "questions" text[],
    "status" text default 'active'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."jobs" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "role" text not null,
    "full_name" text,
    "company_name" text,
    "created_at" timestamp with time zone not null default now(),
    "document_number" text
      );



  create table "public"."settings" (
    "id" uuid not null default gen_random_uuid(),
    "key" text not null,
    "value" jsonb,
    "description" text,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."settings" enable row level security;

CREATE UNIQUE INDEX applications_candidate_id_job_id_key ON public.applications USING btree (candidate_id, job_id);

CREATE UNIQUE INDEX applications_pkey ON public.applications USING btree (id);

CREATE UNIQUE INDEX jobs_pkey ON public.jobs USING btree (id);

CREATE UNIQUE INDEX profiles_document_number_key ON public.profiles USING btree (document_number);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX settings_key_key ON public.settings USING btree (key);

CREATE UNIQUE INDEX settings_pkey ON public.settings USING btree (id);

alter table "public"."applications" add constraint "applications_pkey" PRIMARY KEY using index "applications_pkey";

alter table "public"."jobs" add constraint "jobs_pkey" PRIMARY KEY using index "jobs_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."settings" add constraint "settings_pkey" PRIMARY KEY using index "settings_pkey";

alter table "public"."applications" add constraint "applications_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."applications" validate constraint "applications_candidate_id_fkey";

alter table "public"."applications" add constraint "applications_candidate_id_job_id_key" UNIQUE using index "applications_candidate_id_job_id_key";

alter table "public"."applications" add constraint "applications_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."applications" validate constraint "applications_company_id_fkey";

alter table "public"."applications" add constraint "applications_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."applications" validate constraint "applications_job_id_fkey";

alter table "public"."applications" add constraint "applications_status_check" CHECK ((status = ANY (ARRAY['invited'::text, 'applied'::text, 'interviewing'::text, 'reviewed'::text, 'rejected'::text, 'hired'::text]))) not valid;

alter table "public"."applications" validate constraint "applications_status_check";

alter table "public"."jobs" add constraint "jobs_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."jobs" validate constraint "jobs_company_id_fkey";

alter table "public"."profiles" add constraint "profiles_document_number_key" UNIQUE using index "profiles_document_number_key";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['candidate'::text, 'company'::text, 'admin'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."profiles" add constraint "role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'company'::text, 'candidate'::text]))) not valid;

alter table "public"."profiles" validate constraint "role_check";

alter table "public"."settings" add constraint "settings_key_key" UNIQUE using index "settings_key_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assign_candidate_to_job(p_candidate_id uuid, p_job_id uuid, p_company_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    existing_application_id uuid;
    new_application_id uuid;
BEGIN
    -- Check permissions (simplified for admin/company)
    IF NOT EXISTS (
        SELECT 1 FROM jobs
        WHERE id = p_job_id AND (company_id = p_company_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    ) THEN
        RETURN json_build_object('error', 'Permission denied. You do not own this job or are not an admin.');
    END IF;

    -- Check candidate
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = p_candidate_id AND role = 'candidate'
    ) THEN
        RETURN json_build_object('error', 'Candidate not found.');
    END IF;

    -- Check existing application
    SELECT id INTO existing_application_id
    FROM applications
    WHERE candidate_id = p_candidate_id AND job_id = p_job_id;

    IF existing_application_id IS NOT NULL THEN
        RETURN json_build_object('error', 'Candidate is already assigned to this job.');
    END IF;

    -- Insert with explicit interview_status = 'invited'
    INSERT INTO applications (candidate_id, job_id, company_id, status, interview_status, applied_at)
    VALUES (p_candidate_id, p_job_id, p_company_id, 'invited', 'invited', now())
    RETURNING id INTO new_application_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Candidate successfully invited to the job.',
        'application_id', new_application_id
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_candidate_stats(search_term text, page_limit integer, page_offset integer)
 RETURNS TABLE(id uuid, email text, role text, full_name text, company_name text, created_at timestamp with time zone, document_number text, interviews_count bigint, last_status text)
 LANGUAGE sql
 STABLE
AS $function$
WITH last_app_status AS (
    SELECT
        candidate_id,
        status,
        ROW_NUMBER() OVER(PARTITION BY candidate_id ORDER BY created_at DESC) as rn
    FROM
        applications
)
SELECT
    p.id,
    p.email,
    p.role,
    p.full_name,
    p.company_name,
    p.created_at,
    p.document_number,
    (SELECT COUNT(*) FROM applications WHERE candidate_id = p.id) as interviews_count,
    las.status as last_status
FROM
    profiles p
LEFT JOIN
    last_app_status las ON p.id = las.candidate_id AND las.rn = 1
WHERE
    p.role = 'candidate'
    AND (
        search_term IS NULL OR search_term = '' OR
        p.full_name ILIKE '%' || search_term || '%' OR
        p.email ILIKE '%' || search_term || '%' OR
        p.document_number ILIKE '%' || search_term || '%'
    )
ORDER BY
    p.created_at DESC
LIMIT page_limit
OFFSET page_offset;
$function$
;

CREATE OR REPLACE FUNCTION public.get_company_stats(search_term text, page_limit integer, page_offset integer)
 RETURNS TABLE(id uuid, email text, role text, full_name text, company_name text, created_at timestamp with time zone, interviews_count bigint)
 LANGUAGE sql
 STABLE
AS $function$
SELECT
    p.id,
    p.email,
    p.role,
    p.full_name,
    p.company_name,
    p.created_at,
    COUNT(a.id) as interviews_count
FROM
    profiles p
LEFT JOIN
    applications a ON p.id = a.company_id
WHERE
    p.role = 'company'
    AND (
        search_term IS NULL OR search_term = '' OR
        p.company_name ILIKE '%' || search_term || '%' OR
        p.email ILIKE '%' || search_term || '%'
    )
GROUP BY
    p.id
ORDER BY
    p.created_at DESC
LIMIT page_limit
OFFSET page_offset;
$function$
;

CREATE OR REPLACE FUNCTION public.get_latest_application_status_for_users(user_ids uuid[])
 RETURNS TABLE(candidate_id uuid, last_status text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH ranked_applications AS (
    SELECT 
      a.candidate_id, 
      a.status,
      ROW_NUMBER() OVER(PARTITION BY a.candidate_id ORDER BY a.applied_at DESC) as rn
    FROM applications a
    WHERE a.candidate_id = ANY(user_ids)
  )
  SELECT 
    ra.candidate_id,
    ra.status
  FROM ranked_applications ra
  WHERE ra.rn = 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, company_name, document_number)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'type', -- 'candidate', 'company', or 'admin'
    CASE
        WHEN NEW.raw_user_meta_data->>'type' = 'candidate' THEN NEW.raw_user_meta_data->>'full_name'
        WHEN NEW.raw_user_meta_data->>'type' = 'admin' THEN NEW.raw_user_meta_data->>'full_name'
        ELSE NULL
    END,
    CASE
      WHEN NEW.raw_user_meta_data->>'type' = 'company' THEN NEW.raw_user_meta_data->>'company_name'
      ELSE NULL
    END,
    CASE
        WHEN NEW.raw_user_meta_data->>'type' = 'candidate' THEN NEW.raw_user_meta_data->>'document_number'
        ELSE NULL
    END
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_interview_status(p_application_id uuid, p_new_status text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_main_status text;
    v_current_status text;
BEGIN
    -- Get current status
    SELECT interview_status INTO v_current_status FROM applications WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Application not found');
    END IF;

    -- Map interview_status to main status
    IF p_new_status = 'invited' THEN
        v_main_status := 'invited';
    ELSIF p_new_status = 'in_progress' THEN
        v_main_status := 'interviewing';
    ELSIF p_new_status = 'completed' THEN
        v_main_status := 'reviewed';
    ELSE
        v_main_status := NULL; 
    END IF;

    -- Update
    UPDATE applications
    SET 
        interview_status = p_new_status,
        status = COALESCE(v_main_status, status)
    WHERE id = p_application_id;

    RETURN json_build_object('success', true, 'message', 'Interview status updated to ' || p_new_status);

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$
;

grant delete on table "public"."applications" to "anon";

grant insert on table "public"."applications" to "anon";

grant references on table "public"."applications" to "anon";

grant select on table "public"."applications" to "anon";

grant trigger on table "public"."applications" to "anon";

grant truncate on table "public"."applications" to "anon";

grant update on table "public"."applications" to "anon";

grant delete on table "public"."applications" to "authenticated";

grant insert on table "public"."applications" to "authenticated";

grant references on table "public"."applications" to "authenticated";

grant select on table "public"."applications" to "authenticated";

grant trigger on table "public"."applications" to "authenticated";

grant truncate on table "public"."applications" to "authenticated";

grant update on table "public"."applications" to "authenticated";

grant delete on table "public"."applications" to "service_role";

grant insert on table "public"."applications" to "service_role";

grant references on table "public"."applications" to "service_role";

grant select on table "public"."applications" to "service_role";

grant trigger on table "public"."applications" to "service_role";

grant truncate on table "public"."applications" to "service_role";

grant update on table "public"."applications" to "service_role";

grant delete on table "public"."jobs" to "anon";

grant insert on table "public"."jobs" to "anon";

grant references on table "public"."jobs" to "anon";

grant select on table "public"."jobs" to "anon";

grant trigger on table "public"."jobs" to "anon";

grant truncate on table "public"."jobs" to "anon";

grant update on table "public"."jobs" to "anon";

grant delete on table "public"."jobs" to "authenticated";

grant insert on table "public"."jobs" to "authenticated";

grant references on table "public"."jobs" to "authenticated";

grant select on table "public"."jobs" to "authenticated";

grant trigger on table "public"."jobs" to "authenticated";

grant truncate on table "public"."jobs" to "authenticated";

grant update on table "public"."jobs" to "authenticated";

grant delete on table "public"."jobs" to "service_role";

grant insert on table "public"."jobs" to "service_role";

grant references on table "public"."jobs" to "service_role";

grant select on table "public"."jobs" to "service_role";

grant trigger on table "public"."jobs" to "service_role";

grant truncate on table "public"."jobs" to "service_role";

grant update on table "public"."jobs" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."settings" to "anon";

grant insert on table "public"."settings" to "anon";

grant references on table "public"."settings" to "anon";

grant select on table "public"."settings" to "anon";

grant trigger on table "public"."settings" to "anon";

grant truncate on table "public"."settings" to "anon";

grant update on table "public"."settings" to "anon";

grant delete on table "public"."settings" to "authenticated";

grant insert on table "public"."settings" to "authenticated";

grant references on table "public"."settings" to "authenticated";

grant select on table "public"."settings" to "authenticated";

grant trigger on table "public"."settings" to "authenticated";

grant truncate on table "public"."settings" to "authenticated";

grant update on table "public"."settings" to "authenticated";

grant delete on table "public"."settings" to "service_role";

grant insert on table "public"."settings" to "service_role";

grant references on table "public"."settings" to "service_role";

grant select on table "public"."settings" to "service_role";

grant trigger on table "public"."settings" to "service_role";

grant truncate on table "public"."settings" to "service_role";

grant update on table "public"."settings" to "service_role";


  create policy "Admins can manage all applications"
  on "public"."applications"
  as permissive
  for all
  to public
using ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text))
with check ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));



  create policy "Candidates can manage their own applications."
  on "public"."applications"
  as permissive
  for all
  to public
using ((auth.uid() = candidate_id));



  create policy "Companies can manage applications for their jobs."
  on "public"."applications"
  as permissive
  for all
  to public
using ((auth.uid() = company_id));



  create policy "Admins can manage all jobs"
  on "public"."jobs"
  as permissive
  for all
  to public
using ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text))
with check ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));



  create policy "Candidates can view active or invited jobs."
  on "public"."jobs"
  as permissive
  for select
  to public
using (((status = 'active'::text) OR (EXISTS ( SELECT 1
   FROM public.applications
  WHERE ((applications.job_id = jobs.id) AND (applications.candidate_id = auth.uid()))))));



  create policy "Companies can manage their own jobs."
  on "public"."jobs"
  as permissive
  for all
  to public
using ((auth.uid() = company_id));



  create policy "Admins can manage settings"
  on "public"."settings"
  as permissive
  for all
  to public
using ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text))
with check ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Authenticated users can upload recordings"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'recordings'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Public read access for recordings"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'recordings'::text));



