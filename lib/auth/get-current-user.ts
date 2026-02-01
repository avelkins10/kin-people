import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { people, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current authenticated user from the database.
 * 
 * Looks up the person record associated with the Clerk auth user ID.
 * Returns null if not authenticated or no matching person record exists.
 * 
 * @returns User object with role information, or null if not found
 */
export async function getCurrentUser() {
  const { userId: authUserId } = await auth();

  if (!authUserId) {
    return null;
  }

  try {
    const user = await db
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

    return user[0] || null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;
