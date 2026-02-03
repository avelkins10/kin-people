import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPersonWithDetails } from "@/lib/db/helpers/person-helpers";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

const updatePersonSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional().nullable(),
});

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
  return withPermission(Permission.MANAGE_SETTINGS, async (req, _user) => {
    try {
      const body = await req.json();
      const validated = updatePersonSchema.parse(body);

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (validated.firstName !== undefined) updateData.firstName = validated.firstName;
      if (validated.lastName !== undefined) updateData.lastName = validated.lastName;
      if (validated.email !== undefined) updateData.email = validated.email;
      if (validated.phone !== undefined) updateData.phone = validated.phone;

      const [updated] = await db
        .update(people)
        .set(updateData as typeof people.$inferInsert)
        .where(eq(people.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
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
