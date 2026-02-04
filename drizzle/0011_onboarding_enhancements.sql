-- Onboarding System Enhancements
-- Adds task types, automation config, info collection fields, and personal info storage

-- =============================================================================
-- Part 1: Extend onboarding_tasks table
-- =============================================================================

-- Add new columns to onboarding_tasks
ALTER TABLE "onboarding_tasks"
ADD COLUMN IF NOT EXISTS "task_type" VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS "requires_input" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "input_fields" JSONB,
ADD COLUMN IF NOT EXISTS "is_automated" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "automation_type" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "automation_config" JSONB,
ADD COLUMN IF NOT EXISTS "assignee_type" VARCHAR(50) DEFAULT 'new_hire',
ADD COLUMN IF NOT EXISTS "due_days" INTEGER,
ADD COLUMN IF NOT EXISTS "blocked_by" UUID[];

-- Add comments for documentation
COMMENT ON COLUMN "onboarding_tasks"."task_type" IS 'manual, info_collection, automated, document, meeting';
COMMENT ON COLUMN "onboarding_tasks"."requires_input" IS 'Whether task requires form input from user';
COMMENT ON COLUMN "onboarding_tasks"."input_fields" IS 'JSON schema for input fields when requires_input is true';
COMMENT ON COLUMN "onboarding_tasks"."is_automated" IS 'Whether task triggers automated action on completion';
COMMENT ON COLUMN "onboarding_tasks"."automation_type" IS 'email, api_call, webhook';
COMMENT ON COLUMN "onboarding_tasks"."automation_config" IS 'Configuration for automation (template id, endpoint, etc)';
COMMENT ON COLUMN "onboarding_tasks"."assignee_type" IS 'new_hire, manager, admin - who is responsible for task';
COMMENT ON COLUMN "onboarding_tasks"."due_days" IS 'Days from hire date to complete task';
COMMENT ON COLUMN "onboarding_tasks"."blocked_by" IS 'Array of task IDs that must complete before this task';

-- =============================================================================
-- Part 2: Create onboarding_info_fields table
-- =============================================================================

CREATE TABLE IF NOT EXISTS "onboarding_info_fields" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "field_name" VARCHAR(100) NOT NULL,
  "field_label" VARCHAR(255) NOT NULL,
  "field_type" VARCHAR(50) NOT NULL,
  "field_options" JSONB,
  "is_required" BOOLEAN DEFAULT false,
  "category" VARCHAR(50),
  "display_order" INTEGER NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE "onboarding_info_fields" IS 'Defines personal info fields to collect from new hires';
COMMENT ON COLUMN "onboarding_info_fields"."field_name" IS 'Unique identifier for the field (e.g., shirt_size)';
COMMENT ON COLUMN "onboarding_info_fields"."field_label" IS 'Display label for the field (e.g., Shirt Size)';
COMMENT ON COLUMN "onboarding_info_fields"."field_type" IS 'text, select, date, phone, address, email, number';
COMMENT ON COLUMN "onboarding_info_fields"."field_options" IS 'For select type: [{value, label}]';
COMMENT ON COLUMN "onboarding_info_fields"."category" IS 'uniform, emergency, personal, tax, benefits';
COMMENT ON COLUMN "onboarding_info_fields"."display_order" IS 'Order in which to display the field';

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_onboarding_info_fields_active" ON "onboarding_info_fields"("is_active", "display_order");
CREATE INDEX IF NOT EXISTS "idx_onboarding_info_fields_category" ON "onboarding_info_fields"("category");

-- Ensure unique field names
CREATE UNIQUE INDEX IF NOT EXISTS "idx_onboarding_info_fields_name" ON "onboarding_info_fields"("field_name") WHERE "is_active" = true;

-- =============================================================================
-- Part 3: Create person_onboarding_info table
-- =============================================================================

CREATE TABLE IF NOT EXISTS "person_onboarding_info" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "person_id" UUID NOT NULL,
  "field_id" UUID NOT NULL,
  "field_value" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "verified_by" UUID,
  "verified_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT "person_onboarding_info_person_id_field_id_unique" UNIQUE("person_id", "field_id")
);

-- Add foreign keys
ALTER TABLE "person_onboarding_info" ADD CONSTRAINT "person_onboarding_info_person_id_fk"
  FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "person_onboarding_info" ADD CONSTRAINT "person_onboarding_info_field_id_fk"
  FOREIGN KEY ("field_id") REFERENCES "onboarding_info_fields"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "person_onboarding_info" ADD CONSTRAINT "person_onboarding_info_verified_by_fk"
  FOREIGN KEY ("verified_by") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_person_onboarding_info_person" ON "person_onboarding_info"("person_id");
CREATE INDEX IF NOT EXISTS "idx_person_onboarding_info_field" ON "person_onboarding_info"("field_id");

-- Add comments
COMMENT ON TABLE "person_onboarding_info" IS 'Stores collected personal info for each new hire';
COMMENT ON COLUMN "person_onboarding_info"."field_value" IS 'The value submitted by the new hire';
COMMENT ON COLUMN "person_onboarding_info"."submitted_at" IS 'When the value was submitted';
COMMENT ON COLUMN "person_onboarding_info"."verified_by" IS 'Person who verified the info (manager/admin)';
COMMENT ON COLUMN "person_onboarding_info"."verified_at" IS 'When the info was verified';
