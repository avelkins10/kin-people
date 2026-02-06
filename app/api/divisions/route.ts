import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { divisions } from "@/lib/db/schema";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

export const GET = withAuth(async () => {
  try {
    const divisionsList = await db.select().from(divisions);
    return NextResponse.json(divisionsList);
  } catch (error: unknown) {
    console.error("Error fetching divisions:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

const createDivisionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  isActive: z.boolean().optional().default(true),
});

export const POST = withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
  try {
    const body = await req.json();
    const validated = createDivisionSchema.parse(body);

    const [newDivision] = await db
      .insert(divisions)
      .values({
        name: validated.name,
        description: validated.description || null,
        isActive: validated.isActive ?? true,
      })
      .returning();

    if (newDivision) {
      await logActivity({
        entityType: "division",
        entityId: newDivision.id,
        action: "created",
        details: { name: newDivision.name },
        actorId: user.id,
      });
    }

    return NextResponse.json(newDivision, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating division:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
