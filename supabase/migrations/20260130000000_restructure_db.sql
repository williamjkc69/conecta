
-- Disable RLS momentarily
BEGIN;

-- 0. Safely Backup Old Tables or clean up failed migrations
DO $$ 
BEGIN
    -- Handle profiles
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'old_profiles') THEN
        DROP TABLE IF EXISTS "public"."profiles" CASCADE;
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE "public"."profiles" RENAME TO "old_profiles";
    END IF;

    -- Handle jobs
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'old_jobs') THEN
         DROP TABLE IF EXISTS "public"."jobs" CASCADE;
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jobs') THEN
        ALTER TABLE "public"."jobs" RENAME TO "old_jobs";
    END IF;

    -- Handle applications
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'old_applications') THEN
         DROP TABLE IF EXISTS "public"."applications" CASCADE;
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'applications') THEN
        ALTER TABLE "public"."applications" RENAME TO "old_applications";
    END IF;
    
    -- Handle settings
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'old_settings') THEN
         DROP TABLE IF EXISTS "public"."settings" CASCADE;
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'settings') THEN
        ALTER TABLE "public"."settings" RENAME TO "old_settings";
    END IF;
END $$;

-- 0b. Cleanup New Tables (Idempotency) - Just in case
DROP TABLE IF EXISTS "public"."invitations" CASCADE;
DROP TABLE IF EXISTS "public"."reports" CASCADE;
-- applications, jobs, profiles, settings handled above
DROP TABLE IF EXISTS "public"."listing_questions" CASCADE;
DROP TABLE IF EXISTS "public"."listing_skills" CASCADE;
DROP TABLE IF EXISTS "public"."skills" CASCADE;
DROP TABLE IF EXISTS "public"."listings" CASCADE;
DROP TABLE IF EXISTS "public"."listing_types" CASCADE;
DROP TABLE IF EXISTS "public"."users" CASCADE;
DROP TABLE IF EXISTS "public"."companies" CASCADE;
DROP TABLE IF EXISTS "public"."roles" CASCADE;
DROP TABLE IF EXISTS "public"."application_statuses" CASCADE;

-- 1. Create New Schemas
CREATE TABLE "public"."roles" (
    "id" SERIAL PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."companies" (
    "id" SERIAL PRIMARY KEY,
    "old_id" uuid,
    "name" text NOT NULL,
    "phone" text,
    "email" text,
    "description" text,
    "logo" text,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."users" (
    "id" SERIAL PRIMARY KEY,
    "auth_user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    "role_id" integer REFERENCES "public"."roles"(id),
    "company_id" integer REFERENCES "public"."companies"(id) ON DELETE SET NULL,
    "name" text,
    "lastname" text,
    "email" text NOT NULL,
    "document_number" text,
    "password" text,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_auth_unique UNIQUE (auth_user_id)
);

CREATE TABLE "public"."listing_types" (
    "id" SERIAL PRIMARY KEY,
    "name" text NOT NULL UNIQUE
);

CREATE TABLE "public"."listings" (
    "id" SERIAL PRIMARY KEY,
    "old_id" uuid,
    "company_id" integer NOT NULL REFERENCES "public"."companies"(id) ON DELETE CASCADE,
    "title" text NOT NULL,
    "description" text,
    "listing_type_id" integer REFERENCES "public"."listing_types"(id),
    "location" text,
    "salary_range_min" numeric,
    "salary_range_max" numeric,
    "salary_currency" text,
    "salary_type" text,
    "status" text DEFAULT 'active',
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."skills" (
    "id" SERIAL PRIMARY KEY,
    "name" text NOT NULL UNIQUE
);

CREATE TABLE "public"."listing_skills" (
    "listing_id" integer REFERENCES "public"."listings"(id) ON DELETE CASCADE,
    "skill_id" integer REFERENCES "public"."skills"(id) ON DELETE CASCADE,
    PRIMARY KEY ("listing_id", "skill_id")
);

CREATE TABLE "public"."listing_questions" (
    "id" SERIAL PRIMARY KEY,
    "listing_id" integer REFERENCES "public"."listings"(id) ON DELETE CASCADE,
    "question" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."application_statuses" (
    "id" SERIAL PRIMARY KEY,
    "name" text NOT NULL UNIQUE
);

CREATE TABLE "public"."applications" (
    "id" SERIAL PRIMARY KEY,
    "old_id" uuid,
    "listing_id" integer NOT NULL REFERENCES "public"."listings"(id) ON DELETE CASCADE,
    "user_id" integer NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "status_id" integer REFERENCES "public"."application_statuses"(id),
    "completed_at" timestamp with time zone,
    "call_id" text,
    "recording_url" text,
    "interview_duration" integer,
    "interview_decision" text,
    "feedback" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."reports" (
    "id" SERIAL PRIMARY KEY,
    "application_id" integer NOT NULL UNIQUE REFERENCES "public"."applications"(id) ON DELETE CASCADE,
    "json_data" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."settings" (
    "id" SERIAL PRIMARY KEY,
    "key" text NOT NULL UNIQUE,
    "value" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."invitations" (
    "id" SERIAL PRIMARY KEY,
    "email" text NOT NULL,
    "role" text NOT NULL, -- or role_id
    "listing_id" integer REFERENCES "public"."listings"(id) ON DELETE SET NULL,
    "company_id" integer REFERENCES "public"."companies"(id) ON DELETE CASCADE,
    "token" text NOT NULL UNIQUE,
    "expires_at" timestamp with time zone NOT NULL,
    "status" text DEFAULT 'pending',
    "created_at" timestamp with time zone DEFAULT now()
);

-- Seed Data
INSERT INTO "public"."roles" ("name") VALUES ('admin'), ('company'), ('candidate');
INSERT INTO "public"."listing_types" ("name") VALUES ('remote'), ('on-site'), ('hybrid'), ('full-time'), ('part-time'), ('contract'), ('freelance');
INSERT INTO "public"."application_statuses" ("name") VALUES ('invited'), ('completed'), ('rejected'), ('approved'), ('pending'), ('interviewing');

-- Migration Logic
DO $$
DECLARE
    r_profile RECORD;
    r_job RECORD;
    r_app RECORD;
    v_role_id int;
    v_company_id int;
    v_user_id int;
    v_listing_id int;
    v_type_id int;
    v_status_id int;
    v_skill text;
    v_question text;
    v_new_app_id int;
    v_names text[];
BEGIN
    -- 1. Migrate Profiles
    FOR r_profile IN SELECT * FROM public.old_profiles LOOP
        -- Map Role
        IF r_profile.role = 'recruiter' THEN r_profile.role := 'company'; END IF;
        SELECT id INTO v_role_id FROM public.roles WHERE name = r_profile.role;
        IF v_role_id IS NULL THEN
            SELECT id INTO v_role_id FROM public.roles WHERE name = 'candidate';
        END IF;

        IF r_profile.role = 'company' THEN
            -- Create Company
            INSERT INTO public.companies (old_id, name, email, created_at)
            VALUES (r_profile.id, COALESCE(r_profile.company_name, 'Unknown Company'), r_profile.email, r_profile.created_at)
            RETURNING id INTO v_company_id;

            -- Create User (Admin for Company)
            INSERT INTO public.users (auth_user_id, role_id, company_id, name, email, created_at)
            VALUES (r_profile.id, v_role_id, v_company_id, r_profile.full_name, r_profile.email, r_profile.created_at);
        ELSE
            -- Candidate/Admin
            SELECT regexp_split_to_array(r_profile.full_name, '\s+') INTO v_names;
            
            INSERT INTO public.users (auth_user_id, role_id, name, lastname, email, document_number, created_at)
            VALUES (
                r_profile.id, 
                v_role_id, 
                v_names[1], 
                array_to_string(v_names[2:], ' '), 
                r_profile.email,
                r_profile.document_number,
                r_profile.created_at
            );
        END IF;
    END LOOP;

    -- 2. Migrate Jobs
    FOR r_job IN SELECT * FROM public.old_jobs LOOP
        SELECT id INTO v_company_id FROM public.companies WHERE old_id = r_job.company_id;
        
        IF v_company_id IS NOT NULL THEN
            -- Handle potential mismatch in types (lowercase/mixed)
            SELECT id INTO v_type_id FROM public.listing_types WHERE name = lower(r_job.type);
            IF v_type_id IS NULL THEN
               -- Default to full-time if unknown type
               SELECT id INTO v_type_id FROM public.listing_types WHERE name = 'full-time';
            END IF;
            
            INSERT INTO public.listings (old_id, company_id, title, description, location, status, listing_type_id, created_at)
            VALUES (r_job.id, v_company_id, r_job.title, r_job.description, r_job.location, r_job.status, v_type_id, r_job.created_at)
            RETURNING id INTO v_listing_id;

            IF r_job.requirements IS NOT NULL THEN
                FOREACH v_skill IN ARRAY r_job.requirements LOOP
                    INSERT INTO public.skills (name) VALUES (v_skill) ON CONFLICT (name) DO NOTHING;
                    INSERT INTO public.listing_skills (listing_id, skill_id)
                    SELECT v_listing_id, id FROM public.skills WHERE name = v_skill
                    ON CONFLICT DO NOTHING;
                END LOOP;
            END IF;

            IF r_job.questions IS NOT NULL THEN
                FOREACH v_question IN ARRAY r_job.questions LOOP
                    INSERT INTO public.listing_questions (listing_id, question) VALUES (v_listing_id, v_question);
                END LOOP;
            END IF;
        END IF;
    END LOOP;

    -- 3. Migrate Applications
    FOR r_app IN SELECT * FROM public.old_applications LOOP
        SELECT id INTO v_listing_id FROM public.listings WHERE old_id = r_app.job_id;
        SELECT id INTO v_user_id FROM public.users WHERE auth_user_id = r_app.candidate_id;
        
        IF v_listing_id IS NOT NULL AND v_user_id IS NOT NULL THEN
            IF r_app.status = 'applied' THEN r_app.status := 'pending'; END IF;
            IF r_app.status = 'reviewed' THEN r_app.status := 'completed'; END IF;
            IF r_app.status = 'hired' THEN r_app.status := 'approved'; END IF;
            
            SELECT id INTO v_status_id FROM public.application_statuses WHERE name = r_app.status;
            IF v_status_id IS NULL THEN
                SELECT id INTO v_status_id FROM public.application_statuses WHERE name = 'pending';
            END IF;
            
            INSERT INTO public.applications (old_id, listing_id, user_id, status_id, created_at, interview_duration, call_id, recording_url)
            VALUES (r_app.id, v_listing_id, v_user_id, v_status_id, r_app.created_at, r_app.duration, r_app.call_id, r_app.recording_url)
            RETURNING id INTO v_new_app_id;

            IF r_app.retell_llm_response_data IS NOT NULL OR r_app.transcript IS NOT NULL THEN
                INSERT INTO public.reports (application_id, json_data)
                VALUES (v_new_app_id, jsonb_build_object(
                    'retell', r_app.retell_llm_response_data, 
                    'transcript', r_app.transcript
                ));
            END IF;
        END IF;
    END LOOP;

    -- 4. Settings
    INSERT INTO public.settings (key, value)
    SELECT key, value FROM public.old_settings;

END $$;

-- Drop Old Tables
DROP TABLE IF EXISTS "public"."old_applications" CASCADE;
DROP TABLE IF EXISTS "public"."old_jobs" CASCADE;
DROP TABLE IF EXISTS "public"."old_profiles" CASCADE;
DROP TABLE IF EXISTS "public"."old_settings" CASCADE;

-- Rename and Cleanup
ALTER TABLE "public"."companies" DROP COLUMN "old_id";
ALTER TABLE "public"."listings" DROP COLUMN "old_id";
ALTER TABLE "public"."applications" DROP COLUMN "old_id";

-- Update Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role_id int;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE name = COALESCE(NEW.raw_user_meta_data->>'type', 'candidate');
  IF v_role_id IS NULL THEN
      SELECT id INTO v_role_id FROM public.roles WHERE name = 'candidate';
  END IF;

  INSERT INTO public.users (auth_user_id, email, role_id, name, lastname, document_number)
  VALUES (
      NEW.id,
      NEW.email,
      v_role_id,
      NEW.raw_user_meta_data->>'full_name',
      NULL,
      NEW.raw_user_meta_data->>'document_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view self" ON "public"."users" FOR SELECT USING (auth.uid() = auth_user_id);

COMMIT;
