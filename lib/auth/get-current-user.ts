import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { people, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current authenticated user from the database.
 * Uses Supabase Auth; looks up the person record associated with the
 * Supabase auth user ID (UUID).
 * Returns null if not authenticated or no matching person record exists.
 *
 * @returns User object with role information, or null if not found
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const authUserId = user?.id ?? null;

  if (!authUserId) {
    return null;
  }

  try {
    const person = await db
      .select({
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
        roleId: people.roleId,
        roleName: roles.name,
        roleLevel: roles.level,
        officeId: people.officeId,
        reportsToId: people.reportsToId,
        recruitedById: people.recruitedById,
        status: people.status,
      })
      .from(people)
      .innerJoin(roles, eq(people.roleId, roles.id))
      .where(eq(people.authUserId, authUserId))
      .limit(1);

    return person[0] || null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;
