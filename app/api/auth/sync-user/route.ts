import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, roles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * POST /api/auth/sync-user
 *
 * Syncs a Clerk user to the database by linking authUserId to a person record.
 * Used during onboarding to link Clerk accounts to people records.
 *
 * Expects JSON body:
 * {
 *   clerkUserId: string,
 *   email: string (optional, for matching),
 *   roleId: string (optional; if omitted, default "Sales Rep" role is used)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerkUserId, email, roleId: bodyRoleId } = body;

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "clerkUserId is required" },
        { status: 400 }
      );
    }

    // If email provided, try to find existing person by email
    if (email) {
      const existingPerson = await db
        .select()
        .from(people)
        .where(eq(people.email, email))
        .limit(1);

      if (existingPerson[0]) {
        // Update existing person with authUserId
        await db
          .update(people)
          .set({ authUserId: clerkUserId })
          .where(eq(people.id, existingPerson[0].id));

        return NextResponse.json({
          success: true,
          message: "User linked to existing person record",
          personId: existingPerson[0].id,
        });
      }
    }

    // Resolve roleId: from body or default (Sales Rep)
    let roleId: string | null = null;
    if (bodyRoleId) {
      const roleRow = await db
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.id, bodyRoleId), eq(roles.isActive, true)))
        .limit(1);
      if (roleRow[0]) roleId = roleRow[0].id;
    }
    if (!roleId) {
      const defaultRole = await db
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.name, "Sales Rep"), eq(roles.isActive, true)))
        .limit(1);
      if (defaultRole[0]) roleId = defaultRole[0].id;
    }
    if (!roleId) {
      return NextResponse.json(
        {
          error:
            "No valid role available. Provide a valid roleId or ensure a default role (e.g. Sales Rep) exists in roles.",
        },
        { status: 400 }
      );
    }

    // Create placeholder person with required roleId
    const newPerson = await db
      .insert(people)
      .values({
        firstName: "New",
        lastName: "User",
        email: email || `${clerkUserId}@placeholder.com`,
        authUserId: clerkUserId,
        roleId,
        status: "onboarding",
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Placeholder person record created",
      personId: newPerson[0].id,
    });
  } catch (error: unknown) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
