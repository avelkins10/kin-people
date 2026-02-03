import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { teams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  officeId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(Permission.MANAGE_OWN_TEAM, async (req, user) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validated = updateTeamSchema.parse(body);

      const [previous] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
      if (!previous) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.officeId !== undefined) updateData.officeId = validated.officeId;
      if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

      const [updated] = await db
        .update(teams)
        .set(updateData as typeof teams.$inferInsert)
        .where(eq(teams.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      await logActivity({
        entityType: "team",
        entityId: id,
        action: "updated",
        details: { previous: { name: previous.name, officeId: previous.officeId, isActive: previous.isActive }, new: { name: updated.name, officeId: updated.officeId, isActive: updated.isActive } },
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
      console.error("Error updating team:", error);
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
  return withPermission(Permission.MANAGE_OWN_TEAM, async (_req, user) => {
    try {
      const { id } = await params;
      const [team] = await db
        .update(teams)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(teams.id, id))
        .returning();

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      await logActivity({
        entityType: "team",
        entityId: id,
        action: "deleted",
        details: { name: team.name },
        actorId: user.id,
      });

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Error deleting team:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(_req);
}
