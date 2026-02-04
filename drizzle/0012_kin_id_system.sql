-- KIN ID System and Duplicate Prevention
-- Adds KIN ID for stable person identification and phone normalization for duplicate detection

-- =============================================================================
-- Part 1: Create kin_id_sequence table for atomic ID generation
-- =============================================================================

CREATE TABLE IF NOT EXISTS "kin_id_sequence" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "last_value" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "kin_id_sequence_single_row" CHECK (id = 1)
);

-- Insert initial row (ignore if already exists)
INSERT INTO "kin_id_sequence" ("id", "last_value") VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE "kin_id_sequence" IS 'Single-row table for atomic KIN ID generation';
COMMENT ON COLUMN "kin_id_sequence"."last_value" IS 'The last assigned KIN ID sequence number';

-- =============================================================================
-- Part 2: Add kin_id column to people table
-- =============================================================================

ALTER TABLE "people"
ADD COLUMN IF NOT EXISTS "kin_id" VARCHAR(12) UNIQUE;

-- Create index for KIN ID lookups
CREATE INDEX IF NOT EXISTS "idx_people_kin_id" ON "people"("kin_id");

COMMENT ON COLUMN "people"."kin_id" IS 'Stable identifier (e.g., KIN-0001) assigned when person joins KIN';

-- =============================================================================
-- Part 3: Add normalized_phone columns for duplicate detection
-- =============================================================================

-- Add normalized phone to people table
ALTER TABLE "people"
ADD COLUMN IF NOT EXISTS "normalized_phone" VARCHAR(20);

-- Create unique index on normalized_phone (allows nulls)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_people_normalized_phone_unique"
ON "people"("normalized_phone")
WHERE "normalized_phone" IS NOT NULL;

COMMENT ON COLUMN "people"."normalized_phone" IS 'Phone number normalized to 10 digits for duplicate detection';

-- Add normalized phone to recruits table
ALTER TABLE "recruits"
ADD COLUMN IF NOT EXISTS "normalized_phone" VARCHAR(20);

-- Create unique index on normalized_phone for recruits (allows nulls)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_recruits_normalized_phone_unique"
ON "recruits"("normalized_phone")
WHERE "normalized_phone" IS NOT NULL;

COMMENT ON COLUMN "recruits"."normalized_phone" IS 'Phone number normalized to 10 digits for duplicate detection';

-- Note: We do NOT add a unique constraint on recruits.email because:
-- 1. The same person might be recruited multiple times (dropped out and came back)
-- 2. Duplicate checking is handled at the API level with better UX
-- 3. Recruits are temporary records that get converted to people
