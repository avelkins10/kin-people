-- Supabase Auth & Storage schema migration
-- 1. people.auth_user_id: varchar(100) -> uuid (Supabase Auth UUID)
-- 2. recruits.agreement_document_path: new column (Supabase Storage path)

-- Set existing Clerk (string) IDs to NULL before type change; they cannot be cast to UUID.
UPDATE "people" SET "auth_user_id" = NULL WHERE "auth_user_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "auth_user_id" TYPE uuid USING "auth_user_id"::uuid;
--> statement-breakpoint
ALTER TABLE "recruits" ADD COLUMN IF NOT EXISTS "agreement_document_path" text;
