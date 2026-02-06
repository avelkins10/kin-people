import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { regions } from "@/lib/db/schema";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

export const GET = withAuth(async () => {
  try {
    const regionsList = await db.select().from(regions);
    return NextResponse.json(regionsList);
  } catch (error: unknown) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

const createRegionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  divisionId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

export const POST = withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
  try {
    const body = await req.json();
    const validated = createRegionSchema.parse(body);

    const [newRegion] = await db
      .insert(regions)
      .values({
        name: validated.name,
        description: validated.description || null,
        divisionId: validated.divisionId || null,
        isActive: validated.isActive ?? true,
      })
      .returning();

    if (newRegion) {
      await logActivity({
        entityType: "region",
        entityId: newRegion.id,
        action: "created",
        details: { name: newRegion.name, divisionId: newRegion.divisionId },
        actorId: user.id,
      });
    }

    return NextResponse.json(newRegion, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating region:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
