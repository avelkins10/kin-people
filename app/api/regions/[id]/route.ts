import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { regions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

const updateRegionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(255).nullable().optional(),
  divisionId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validated = updateRegionSchema.parse(body);

      const [previous] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);
      if (!previous) {
        return NextResponse.json({ error: "Region not found" }, { status: 404 });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.divisionId !== undefined) updateData.divisionId = validated.divisionId;
      if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

      const [updated] = await db
        .update(regions)
        .set(updateData as typeof regions.$inferInsert)
        .where(eq(regions.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Region not found" }, { status: 404 });
      }

      await logActivity({
        entityType: "region",
        entityId: id,
        action: "updated",
        details: { previous: { name: previous.name, divisionId: previous.divisionId, isActive: previous.isActive }, new: { name: updated.name, divisionId: updated.divisionId, isActive: updated.isActive } },
        actorId: user.id,
      });

      return NextResponse.json(updated);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating region:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(Permission.MANAGE_SETTINGS, async (_req, user) => {
    try {
      const { id } = await params;
      const [region] = await db
        .update(regions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(regions.id, id))
        .returning();

      if (!region) {
        return NextResponse.json({ error: "Region not found" }, { status: 404 });
      }

      await logActivity({
        entityType: "region",
        entityId: id,
        action: "deleted",
        details: { name: region.name },
        actorId: user.id,
      });

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Error deleting region:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(_req);
}
