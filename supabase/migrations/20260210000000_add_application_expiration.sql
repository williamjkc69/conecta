ALTER TABLE "public"."applications" ADD COLUMN "expiration_date" timestamp with time zone;

INSERT INTO "public"."settings" ("key", "value")
VALUES ('application_expiration_days', '7'::jsonb)
ON CONFLICT ("key") DO NOTHING;
