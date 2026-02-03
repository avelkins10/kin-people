-- Add division to offices
ALTER TABLE "offices" ADD COLUMN IF NOT EXISTS "division" varchar(100);

CREATE INDEX IF NOT EXISTS "idx_offices_division" ON "offices" USING btree ("division");

-- Office leadership table: AD/Regional/Divisional/VP assignments with effective dates
CREATE TABLE IF NOT EXISTS "office_leadership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"office_id" uuid REFERENCES "offices"("id"),
	"region" varchar(100),
	"division" varchar(100),
	"role_type" varchar(50) NOT NULL,
	"person_id" uuid NOT NULL REFERENCES "people"("id") ON DELETE CASCADE,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_office_leadership_office" ON "office_leadership" USING btree ("office_id");
CREATE INDEX IF NOT EXISTS "idx_office_leadership_region" ON "office_leadership" USING btree ("region");
CREATE INDEX IF NOT EXISTS "idx_office_leadership_division" ON "office_leadership" USING btree ("division");
CREATE INDEX IF NOT EXISTS "idx_office_leadership_person" ON "office_leadership" USING btree ("person_id");
CREATE INDEX IF NOT EXISTS "idx_office_leadership_dates" ON "office_leadership" USING btree ("effective_from", "effective_to");
