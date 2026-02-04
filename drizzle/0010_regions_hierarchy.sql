-- Create regions table for normalized region entities
CREATE TABLE IF NOT EXISTS "regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_regions_active" ON "regions" USING btree ("is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "regions_name_unique" ON "regions" USING btree ("name");

-- Add region_id FK to offices
ALTER TABLE "offices" ADD COLUMN IF NOT EXISTS "region_id" uuid REFERENCES "regions"("id");
CREATE INDEX IF NOT EXISTS "idx_offices_region_id" ON "offices" USING btree ("region_id");

-- Add region_id FK to office_leadership
ALTER TABLE "office_leadership" ADD COLUMN IF NOT EXISTS "region_id" uuid REFERENCES "regions"("id");
CREATE INDEX IF NOT EXISTS "idx_office_leadership_region_id" ON "office_leadership" USING btree ("region_id");

-- Migrate existing varchar region data to regions table
INSERT INTO "regions" ("name")
SELECT DISTINCT "region" FROM "offices"
WHERE "region" IS NOT NULL AND "region" != ''
ON CONFLICT ("name") DO NOTHING;

-- Link offices to regions
UPDATE "offices" o
SET "region_id" = r."id"
FROM "regions" r
WHERE o."region" = r."name" AND o."region_id" IS NULL;

-- Update office_leadership to use region_id
UPDATE "office_leadership" ol
SET "region_id" = r."id"
FROM "regions" r
WHERE ol."region" = r."name" AND ol."region_id" IS NULL;
