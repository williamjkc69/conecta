-- Migration to add ON DELETE CASCADE to users table FK
BEGIN;

-- 1. Drop the existing foreign key constraint
ALTER TABLE "public"."users" DROP CONSTRAINT "users_auth_user_id_fkey";

-- 2. Add the new constraint with ON DELETE CASCADE
ALTER TABLE "public"."users" 
  ADD CONSTRAINT "users_auth_user_id_fkey" 
  FOREIGN KEY ("auth_user_id") 
  REFERENCES auth.users("id") 
  ON DELETE CASCADE;

COMMIT;
