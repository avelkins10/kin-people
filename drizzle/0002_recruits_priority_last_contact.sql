-- Add priority and last_contact_date to recruits table
ALTER TABLE "recruits" ADD COLUMN IF NOT EXISTS "priority" varchar(20);
--> statement-breakpoint
ALTER TABLE "recruits" ADD COLUMN IF NOT EXISTS "last_contact_date" timestamp with time zone;
