import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  level: z.number().int().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(Permission.MANAGE_SETTINGS, async (req, _user) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validated = updateRoleSchema.parse(body);

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.level !== undefined) updateData.level = validated.level;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
      if (validated.sortOrder !== undefined) updateData.sortOrder = validated.sortOrder;

      const [updated] = await db
        .update(roles)
        .set(updateData as typeof roles.$inferInsert)
        .where(eq(roles.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }
      return NextResponse.json(updated);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating role:", error);
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
  return withPermission(Permission.MANAGE_SETTINGS, async (_req, _user) => {
    try {
      const { id } = await params;
      const [role] = await db
        .update(roles)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(roles.id, id))
        .returning();

      if (!role) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Error deleting role:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(_req);
}
