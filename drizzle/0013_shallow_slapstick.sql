CREATE TABLE IF NOT EXISTS "repcard_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"repcard_user_id" varchar(50),
	"repcard_username" varchar(100),
	"job_title" varchar(100),
	"repcard_role" varchar(50),
	"repcard_office" varchar(100),
	"repcard_team" varchar(100),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_sync_error" varchar(500),
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "repcard_office_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"office_id" uuid NOT NULL,
	"repcard_office" varchar(100) NOT NULL,
	"repcard_team" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "repcard_role_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"repcard_role" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "repcard_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"can_create" boolean DEFAULT false NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"can_deactivate" boolean DEFAULT false NOT NULL,
	"can_link" boolean DEFAULT false NOT NULL,
	"can_sync" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repcard_person_id" ON "repcard_accounts" ("person_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repcard_user_id" ON "repcard_accounts" ("repcard_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_repcard_status" ON "repcard_accounts" ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repcard_office_mapping_office_id" ON "repcard_office_mappings" ("office_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repcard_role_mapping_role_id" ON "repcard_role_mappings" ("role_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repcard_permissions_role_id" ON "repcard_permissions" ("role_id");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "repcard_accounts" ADD CONSTRAINT "repcard_accounts_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "repcard_accounts" ADD CONSTRAINT "repcard_accounts_created_by_people_id_fk" FOREIGN KEY ("created_by") REFERENCES "people"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "repcard_office_mappings" ADD CONSTRAINT "repcard_office_mappings_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "repcard_role_mappings" ADD CONSTRAINT "repcard_role_mappings_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "repcard_permissions" ADD CONSTRAINT "repcard_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
