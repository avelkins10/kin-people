import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { offices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

const updateOfficeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  region: z.string().nullable().optional(),
  division: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(Permission.MANAGE_ALL_OFFICES, async (req, user) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validated = updateOfficeSchema.parse(body);

      const [previous] = await db.select().from(offices).where(eq(offices.id, id)).limit(1);
      if (!previous) {
        return NextResponse.json({ error: "Office not found" }, { status: 404 });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.region !== undefined) updateData.region = validated.region;
      if (validated.division !== undefined) updateData.division = validated.division;
      if (validated.address !== undefined) updateData.address = validated.address;
      if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

      const [updated] = await db
        .update(offices)
        .set(updateData as typeof offices.$inferInsert)
        .where(eq(offices.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Office not found" }, { status: 404 });
      }

      await logActivity({
        entityType: "office",
        entityId: id,
        action: "updated",
        details: { previous: { name: previous.name, region: previous.region, division: previous.division, address: previous.address, isActive: previous.isActive }, new: { name: updated.name, region: updated.region, division: updated.division, address: updated.address, isActive: updated.isActive } },
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
      console.error("Error updating office:", error);
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
  return withPermission(Permission.MANAGE_ALL_OFFICES, async (_req, user) => {
    try {
      const { id } = await params;
      const [office] = await db
        .update(offices)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(offices.id, id))
        .returning();

      if (!office) {
        return NextResponse.json({ error: "Office not found" }, { status: 404 });
      }

      await logActivity({
        entityType: "office",
        entityId: id,
        action: "deleted",
        details: { name: office.name },
        actorId: user.id,
      });

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Error deleting office:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(_req);
}
