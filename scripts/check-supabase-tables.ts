/**
 * Check Supabase (or any postgres DB) for expected tables.
 * Run: npm run db:migrate (uses .env.local DATABASE_URL) then:
 *   npx tsx scripts/check-supabase-tables.ts
 * Or with explicit URL:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/check-supabase-tables.ts
 */
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Set it in .env.local or pass it when running.");
  process.exit(1);
}
const dbUrl: string = DATABASE_URL;

const expectedTables = [
  "onboarding_info_fields",
  "onboarding_tasks",
  "person_onboarding_info",
  "people",
  "recruits",
];

async function main() {
  const sql = postgres(dbUrl, { max: 1, ssl: "require" });
  try {
    const host = new URL(dbUrl).hostname;
    console.log("Checking database at:", host.replace(/^db\./, "").split(".")[0] + ".supabase.co");
    console.log("");

    const tables = await sql`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('public', 'drizzle')
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `;

    console.log("Tables in public / drizzle:");
    for (const t of tables) {
      const name = t.table_schema === "public" ? t.table_name : `drizzle.${t.table_name}`;
      const expected = expectedTables.includes(t.table_name);
      console.log(`  ${expected ? "✓" : " "} ${name}`);
    }

    console.log("");
    const missing = expectedTables.filter(
      (name) => !tables.some((t) => t.table_schema === "public" && t.table_name === name)
    );
    if (missing.length) {
      console.log("Missing expected tables:", missing.join(", "));
      console.log("  → Run: DATABASE_URL=\"...\" npm run db:migrate");
    } else {
      console.log("All expected tables present.");
    }

    const hasOnboardingFields = tables.some(
      (t) => t.table_schema === "public" && t.table_name === "onboarding_info_fields"
    );
    if (hasOnboardingFields) {
      const count = await sql`SELECT COUNT(*) AS n FROM public.onboarding_info_fields`;
      console.log("  onboarding_info_fields row count:", (count[0] as { n: string }).n);
    }
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
