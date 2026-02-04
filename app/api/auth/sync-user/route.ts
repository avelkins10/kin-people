import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, roles } from "@/lib/db/schema";
import { sanitizeErrorMessage } from "@/lib/utils";
import { and, eq } from "drizzle-orm";

/**
 * POST /api/auth/sync-user
 *
 * Syncs a Supabase Auth user to the database by linking authUserId to a person record.
 * Used during onboarding (e.g. after email confirmation) to link Supabase accounts to people records.
 *
 * Expects JSON body:
 * {
 *   supabaseUserId: string (UUID, required),
 *   email: string (required; e.g. from confirmed signup),
 *   roleId: string (optional; if omitted, default "Sales Rep" role is used)
 * }
 *
 * Can be called without authentication for new signups.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supabaseUserId, email: bodyEmail, roleId: bodyRoleId } = body;

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: "supabaseUserId is required" },
        { status: 400 }
      );
    }

    const email = bodyEmail;

    if (!email) {
      return NextResponse.json(
        { error: "email is required when calling sync-user (e.g. from confirmed signup)" },
        { status: 400 }
      );
    }

    // Try to find existing person by email
    {
      const existingPerson = await db
        .select()
        .from(people)
        .where(eq(people.email, email))
        .limit(1);

      if (existingPerson[0]) {
        await db
          .update(people)
          .set({ authUserId: supabaseUserId })
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
        email,
        authUserId: supabaseUserId,
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
    console.error("Error syncing Supabase user:", error);

    const err = error as NodeJS.ErrnoException;
    const code = err?.code;
    const isConnectionError =
      code === "EHOSTUNREACH" ||
      code === "ENOTFOUND" ||
      code === "ECONNREFUSED" ||
      code === "ETIMEDOUT";

    const userMessage = isConnectionError
      ? "Cannot reach the database. Use the IPv4-compatible Shared Pooler for DATABASE_URL in .env.local (see Supabase Connect → Connection String) and check your network."
      : err instanceof Error
        ? err.message
        : "Internal server error";

    return NextResponse.json(
      { error: sanitizeErrorMessage(userMessage, "Internal server error") },
      { status: 500 }
    );
  }
}
