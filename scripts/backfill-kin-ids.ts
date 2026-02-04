/**
 * Backfill KIN IDs for existing people records.
 *
 * Orders people by hire date (earliest first) to ensure consistent numbering,
 * then assigns KIN IDs to those without one.
 *
 * Usage: npx tsx scripts/backfill-kin-ids.ts
 */
import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local and try again.");
  process.exit(1);
}

async function main() {
  // Dynamic imports after env is loaded
  const { db } = await import("../lib/db");
  const { people, kinIdSequence } = await import("../lib/db/schema");
  const { isNull, asc, sql, eq } = await import("drizzle-orm");
  const { formatKinId } = await import("../lib/db/helpers/kin-id-helpers");
  const { normalizePhone } = await import("../lib/db/helpers/duplicate-helpers");

  console.log("Starting KIN ID backfill...\n");

  // Initialize sequence table if needed
  console.log("Ensuring kin_id_sequence table is initialized...");
  await db.execute(sql`
    INSERT INTO kin_id_sequence (id, last_value) VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
  `);

  // Get all people without KIN IDs, ordered by hire date (nulls last), then created_at
  const peopleWithoutKinId = await db
    .select({
      id: people.id,
      firstName: people.firstName,
      lastName: people.lastName,
      email: people.email,
      phone: people.phone,
      normalizedPhone: people.normalizedPhone,
      hireDate: people.hireDate,
      createdAt: people.createdAt,
    })
    .from(people)
    .where(isNull(people.kinId))
    .orderBy(
      sql`${people.hireDate} ASC NULLS LAST`,
      asc(people.createdAt)
    );

  console.log(`Found ${peopleWithoutKinId.length} people without KIN IDs.\n`);

  if (peopleWithoutKinId.length === 0) {
    console.log("No people need KIN IDs. Done.");
    return;
  }

  // Process each person
  let successCount = 0;
  let errorCount = 0;

  for (const person of peopleWithoutKinId) {
    try {
      // Atomic increment of sequence
      const result = await db
        .update(kinIdSequence)
        .set({
          lastValue: sql`${kinIdSequence.lastValue} + 1`,
        })
        .where(eq(kinIdSequence.id, 1))
        .returning({ lastValue: kinIdSequence.lastValue });

      if (!result[0]) {
        throw new Error("Failed to increment sequence");
      }

      const kinId = formatKinId(result[0].lastValue);

      // Also normalize phone if not already set
      const normalizedPhoneValue = person.normalizedPhone || normalizePhone(person.phone);

      // Update person with KIN ID
      await db
        .update(people)
        .set({
          kinId,
          normalizedPhone: normalizedPhoneValue,
        })
        .where(eq(people.id, person.id));

      console.log(
        `  ${kinId} -> ${person.firstName} ${person.lastName} (${person.email})` +
          (person.hireDate ? ` [hired: ${person.hireDate}]` : "")
      );
      successCount++;
    } catch (error) {
      console.error(
        `  ERROR: Failed to assign KIN ID to ${person.firstName} ${person.lastName}:`,
        error instanceof Error ? error.message : String(error)
      );
      errorCount++;
    }
  }

  console.log(`\nBackfill complete:`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors:  ${errorCount}`);

  // Show final sequence value
  const finalSequence = await db
    .select({ lastValue: kinIdSequence.lastValue })
    .from(kinIdSequence)
    .where(eq(kinIdSequence.id, 1))
    .limit(1);

  console.log(`\nCurrent sequence value: ${finalSequence[0]?.lastValue ?? 0}`);
  console.log(`Next KIN ID will be: ${formatKinId((finalSequence[0]?.lastValue ?? 0) + 1)}`);
}

main()
  .then(() => {
    console.log("\nDone.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nBackfill failed:", err);
    process.exit(1);
  });
