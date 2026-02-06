CREATE TABLE IF NOT EXISTS "repcard_region_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_id" uuid NOT NULL,
	"repcard_office" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repcard_region_id" ON "repcard_region_mappings" ("region_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "repcard_region_mappings" ADD CONSTRAINT "repcard_region_mappings_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
