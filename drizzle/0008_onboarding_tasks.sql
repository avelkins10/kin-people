-- Create onboarding_tasks table
CREATE TABLE IF NOT EXISTS "onboarding_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "task_order" integer NOT NULL,
  "category" text NOT NULL,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create person_onboarding_progress table
CREATE TABLE IF NOT EXISTS "person_onboarding_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "person_id" uuid NOT NULL,
  "task_id" uuid NOT NULL,
  "completed" boolean DEFAULT false,
  "completed_at" timestamp,
  "completed_by" uuid,
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "person_onboarding_progress_person_id_task_id_unique" UNIQUE("person_id", "task_id")
);

-- Add foreign keys
ALTER TABLE "person_onboarding_progress" ADD CONSTRAINT "person_onboarding_progress_person_id_people_id_fk"
  FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "person_onboarding_progress" ADD CONSTRAINT "person_onboarding_progress_task_id_onboarding_tasks_id_fk"
  FOREIGN KEY ("task_id") REFERENCES "onboarding_tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "person_onboarding_progress" ADD CONSTRAINT "person_onboarding_progress_completed_by_people_id_fk"
  FOREIGN KEY ("completed_by") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_person_onboarding_person" ON "person_onboarding_progress"("person_id");
CREATE INDEX IF NOT EXISTS "idx_person_onboarding_task" ON "person_onboarding_progress"("task_id");
CREATE INDEX IF NOT EXISTS "idx_onboarding_tasks_active" ON "onboarding_tasks"("is_active", "task_order");

-- Seed default onboarding tasks
INSERT INTO "onboarding_tasks" ("title", "description", "category", "task_order", "is_active") VALUES
  ('Complete I-9 Form', 'Required federal employment verification', 'admin', 1, true),
  ('Submit W-4 for Tax Withholding', 'Federal tax withholding form', 'admin', 2, true),
  ('Review and Sign Employee Handbook', 'Acknowledge company policies', 'admin', 3, true),
  ('Set Up Direct Deposit', 'Banking information for payroll', 'admin', 4, true),
  ('Complete Benefits Enrollment', 'Health insurance and benefits selection', 'admin', 5, true),
  ('Attend New Hire Orientation', 'Company overview and culture introduction', 'training', 6, true),
  ('Complete Product Training', 'Learn about company products and services', 'training', 7, true),
  ('Shadow Team Member', 'Job-specific training and mentorship', 'training', 8, true),
  ('Receive Company Equipment', 'Laptop, phone, access badge, etc.', 'equipment', 9, true),
  ('Set Up Email and Accounts', 'Corporate email, Slack, and system access', 'setup', 10, true),
  ('Add to Company Directory', 'Internal contact list and org chart', 'setup', 11, true),
  ('Schedule 30-Day Check-In', 'First feedback session with manager', 'admin', 12, true);
