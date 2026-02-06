CREATE TABLE IF NOT EXISTS "divisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "regions" ADD COLUMN "division_id" uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_divisions_active" ON "divisions" ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "divisions_name_unique" ON "divisions" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_regions_division" ON "regions" ("division_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "regions" ADD CONSTRAINT "regions_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
