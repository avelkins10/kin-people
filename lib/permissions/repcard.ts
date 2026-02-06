import { checkRepcardPermission, type RepcardOperation } from "@/lib/db/helpers/repcard-helpers";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if a user can perform a RepCard operation.
 * Looks up the user's roleId, then checks the repcard_permissions table.
 *
 * Separate from core Permission enum - does NOT modify lib/permissions/roles.ts.
 */
export async function canManageRepcardAccounts(
  userId: string,
  operation: RepcardOperation
): Promise<boolean> {
  const rows = await db
    .select({ roleId: people.roleId })
    .from(people)
    .where(eq(people.id, userId))
    .limit(1);

  const person = rows[0];
  if (!person?.roleId) return false;

  return checkRepcardPermission(person.roleId, operation);
}
