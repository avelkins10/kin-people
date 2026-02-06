import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { divisions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

const updateDivisionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(255).nullable().optional(),
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
      const validated = updateDivisionSchema.parse(body);

      const [previous] = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1);
      if (!previous) {
        return NextResponse.json({ error: "Division not found" }, { status: 404 });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

      const [updated] = await db
        .update(divisions)
        .set(updateData as typeof divisions.$inferInsert)
        .where(eq(divisions.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Division not found" }, { status: 404 });
      }

      await logActivity({
        entityType: "division",
        entityId: id,
        action: "updated",
        details: { previous: { name: previous.name, isActive: previous.isActive }, new: { name: updated.name, isActive: updated.isActive } },
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
      console.error("Error updating division:", error);
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
      const [division] = await db
        .update(divisions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(divisions.id, id))
        .returning();

      if (!division) {
        return NextResponse.json({ error: "Division not found" }, { status: 404 });
      }

      await logActivity({
        entityType: "division",
        entityId: id,
        action: "deleted",
        details: { name: division.name },
        actorId: user.id,
      });

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Error deleting division:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(_req);
}
