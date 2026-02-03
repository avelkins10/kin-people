import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { officeLeadership } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

const updateLeadershipSchema = z.object({
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

/**
 * PATCH /api/office-leadership/[id]
 * Update a leadership assignment (e.g. set effective_to when someone leaves the role).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(Permission.MANAGE_ALL_OFFICES, async (req, user) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validated = updateLeadershipSchema.parse(body);

      const [existing] = await db
        .select()
        .from(officeLeadership)
        .where(eq(officeLeadership.id, id))
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: "Leadership assignment not found" }, { status: 404 });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (validated.effectiveFrom !== undefined) updateData.effectiveFrom = validated.effectiveFrom;
      if (validated.effectiveTo !== undefined) updateData.effectiveTo = validated.effectiveTo;

      const [updated] = await db
        .update(officeLeadership)
        .set(updateData as typeof officeLeadership.$inferInsert)
        .where(eq(officeLeadership.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Leadership assignment not found" }, { status: 404 });
      }

      await logActivity({
        entityType: "office",
        entityId: updated.officeId ?? updated.region ?? updated.division ?? updated.id,
        action: "updated",
        details: {
          leadershipId: updated.id,
          roleType: updated.roleType,
          effectiveFrom: updated.effectiveFrom,
          effectiveTo: updated.effectiveTo,
        },
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
      console.error("Error updating office leadership:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * DELETE /api/office-leadership/[id]
 * Remove a leadership assignment (hard delete). Prefer PATCH with effectiveTo for historical accuracy.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(Permission.MANAGE_ALL_OFFICES, async (_req, user) => {
    try {
      const { id } = await params;

      const [deleted] = await db
        .delete(officeLeadership)
        .where(eq(officeLeadership.id, id))
        .returning();

      if (!deleted) {
        return NextResponse.json({ error: "Leadership assignment not found" }, { status: 404 });
      }

      await logActivity({
        entityType: "office",
        entityId: deleted.officeId ?? deleted.region ?? deleted.division ?? deleted.id,
        action: "deleted",
        details: {
          leadershipId: deleted.id,
          roleType: deleted.roleType,
          personId: deleted.personId,
        },
        actorId: user.id,
      });

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Error deleting office leadership:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(_req);
}
