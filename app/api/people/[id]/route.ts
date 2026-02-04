import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPersonWithDetails } from "@/lib/db/helpers/person-helpers";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { personFormSchema } from "@/lib/validation/person-form";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (req, user) => {
    try {
      const personData = await getPersonWithDetails(id);

      if (!personData) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(personData);
    } catch (error: unknown) {
      console.error("Error fetching person:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
    try {
      const body = await req.json();

      // Use personFormSchema.partial() for validation since all fields are optional in updates
      const validated = personFormSchema.partial().parse(body);

      // Build update data object with only provided fields
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (validated.firstName !== undefined) updateData.firstName = validated.firstName;
      if (validated.lastName !== undefined) updateData.lastName = validated.lastName;
      if (validated.email !== undefined) updateData.email = validated.email;
      if (validated.phone !== undefined) updateData.phone = validated.phone;
      if (validated.roleId !== undefined) updateData.roleId = validated.roleId;
      if (validated.officeId !== undefined) updateData.officeId = validated.officeId;
      if (validated.reportsToId !== undefined) updateData.reportsToId = validated.reportsToId;
      if (validated.status !== undefined) updateData.status = validated.status;
      if (validated.hireDate !== undefined) updateData.hireDate = validated.hireDate;

      // Update the person in the database
      const [updated] = await db
        .update(people)
        .set(updateData as typeof people.$inferInsert)
        .where(eq(people.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }

      // Log the activity
      try {
        await logActivity({
          entityType: "person" as "office", // Type assertion needed as 'person' is not in the union yet
          entityId: id,
          action: "updated",
          details: validated,
          actorId: user.id,
        });
      } catch (logError) {
        // Log error but don't fail the request
        console.error("Failed to log activity:", logError);
      }

      return NextResponse.json(updated);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating person:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
