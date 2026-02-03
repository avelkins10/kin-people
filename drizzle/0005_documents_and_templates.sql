-- Documents table (polymorphic: recruits and people)
CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "recruit_id" uuid REFERENCES "recruits"("id"),
  "person_id" uuid REFERENCES "people"("id"),
  "document_type" varchar(50) NOT NULL,
  "signnow_document_id" varchar(100),
  "signnow_template_id" varchar(100),
  "status" varchar(50) DEFAULT 'pending',
  "total_signers" integer DEFAULT 1,
  "signed_count" integer DEFAULT 0,
  "sent_at" timestamp with time zone,
  "viewed_at" timestamp with time zone,
  "signed_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "voided_at" timestamp with time zone,
  "storage_path" text,
  "storage_url" text,
  "metadata" jsonb DEFAULT '{}',
  "created_by_id" uuid REFERENCES "people"("id"),
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "documents_owner_check" CHECK ("recruit_id" IS NOT NULL OR "person_id" IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS "idx_documents_recruit" ON "documents" USING btree ("recruit_id");
CREATE INDEX IF NOT EXISTS "idx_documents_person" ON "documents" USING btree ("person_id");
CREATE INDEX IF NOT EXISTS "idx_documents_status" ON "documents" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_documents_signnow" ON "documents" USING btree ("signnow_document_id");
CREATE INDEX IF NOT EXISTS "idx_documents_expires" ON "documents" USING btree ("expires_at");
CREATE INDEX IF NOT EXISTS "idx_documents_type" ON "documents" USING btree ("document_type");

-- Document templates table
CREATE TABLE IF NOT EXISTS "document_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "document_type" varchar(50) NOT NULL UNIQUE,
  "display_name" varchar(100) NOT NULL,
  "signnow_template_id" varchar(100),
  "require_recruit" boolean DEFAULT true,
  "require_manager" boolean DEFAULT false,
  "require_hr" boolean DEFAULT false,
  "expiration_days" integer DEFAULT 30,
  "reminder_frequency_days" integer DEFAULT 3,
  "description" text,
  "metadata" jsonb DEFAULT '{}',
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_document_templates_type" ON "document_templates" USING btree ("document_type");
CREATE INDEX IF NOT EXISTS "idx_document_templates_active" ON "document_templates" USING btree ("is_active");

-- Seed default document types
INSERT INTO "document_templates" ("document_type", "display_name", "description", "signnow_template_id")
VALUES 
  ('rep_agreement', 'Independent Contractor Agreement (Rep Agreement)', 'Standard agreement for new sales representatives', NULL),
  ('tax_forms', 'Tax Forms (W-9/1099)', 'Required tax documentation for contractors', NULL),
  ('onboarding_checklist', 'Onboarding Checklist', 'New hire onboarding documentation and acknowledgments', NULL),
  ('offer_letter', 'Offer Letter', 'Formal offer letter for new hires', NULL)
ON CONFLICT (document_type) DO NOTHING;
