import { db } from "@/lib/db";
import { kinIdSequence, people } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";

/**
 * Format a sequence number as a KIN ID string.
 * @param sequence - The sequence number (e.g., 1, 42, 1234)
 * @returns Formatted KIN ID (e.g., "KIN-0001", "KIN-0042", "KIN-1234")
 */
export function formatKinId(sequence: number): string {
  return `KIN-${String(sequence).padStart(4, "0")}`;
}

/**
 * Generate the next KIN ID atomically.
 * Uses UPDATE ... RETURNING for atomic increment.
 *
 * @param tx - Optional transaction context
 * @returns The next KIN ID string (e.g., "KIN-0001")
 */
export async function generateKinId(tx?: PgTransaction<any, any, any>): Promise<string> {
  const executor = tx || db;

  // Atomic increment and return
  const result = await executor
    .update(kinIdSequence)
    .set({
      lastValue: sql`${kinIdSequence.lastValue} + 1`,
    })
    .where(eq(kinIdSequence.id, 1))
    .returning({ lastValue: kinIdSequence.lastValue });

  if (!result[0]) {
    throw new Error("Failed to generate KIN ID: sequence row not found");
  }

  return formatKinId(result[0].lastValue);
}

/**
 * Get the current (last assigned) KIN ID sequence value without incrementing.
 * Useful for reporting or debugging.
 *
 * @returns The current sequence value
 */
export async function getCurrentKinIdSequence(): Promise<number> {
  const result = await db
    .select({ lastValue: kinIdSequence.lastValue })
    .from(kinIdSequence)
    .where(eq(kinIdSequence.id, 1))
    .limit(1);

  return result[0]?.lastValue ?? 0;
}

/**
 * Assign a KIN ID to a person record.
 * Generates a new KIN ID and updates the person record.
 *
 * @param personId - The person's UUID
 * @param tx - Optional transaction context
 * @returns The assigned KIN ID
 */
export async function assignKinIdToPerson(
  personId: string,
  tx?: PgTransaction<any, any, any>
): Promise<string> {
  const executor = tx || db;

  // Check if person already has a KIN ID
  const existing = await executor
    .select({ kinId: people.kinId })
    .from(people)
    .where(eq(people.id, personId))
    .limit(1);

  if (existing[0]?.kinId) {
    return existing[0].kinId;
  }

  // Generate new KIN ID
  const kinId = await generateKinId(tx);

  // Update person record
  await executor
    .update(people)
    .set({ kinId })
    .where(eq(people.id, personId));

  return kinId;
}

/**
 * Look up a person by their KIN ID.
 *
 * @param kinId - The KIN ID to look up (e.g., "KIN-0001")
 * @returns The person record or null if not found
 */
export async function getPersonByKinId(kinId: string) {
  const result = await db
    .select()
    .from(people)
    .where(eq(people.kinId, kinId))
    .limit(1);

  return result[0] || null;
}
