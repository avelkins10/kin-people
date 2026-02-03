-- Supabase Auth & Storage schema migration
-- 1. people.auth_user_id: varchar(100) -> uuid (Supabase Auth UUID)
-- 2. recruits.agreement_document_path: new column (Supabase Storage path)

-- Only alter auth_user_id if not already uuid (avoids failure when RLS policies from 0001 already reference it).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'people' AND column_name = 'auth_user_id'
      AND data_type != 'uuid'
  ) THEN
    UPDATE "people" SET "auth_user_id" = NULL WHERE "auth_user_id" IS NOT NULL;
    ALTER TABLE "people" ALTER COLUMN "auth_user_id" TYPE uuid USING "auth_user_id"::uuid;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "recruits" ADD COLUMN IF NOT EXISTS "agreement_document_path" text;
