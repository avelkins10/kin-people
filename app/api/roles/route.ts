import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = db.select().from(roles).orderBy(asc(roles.sortOrder), asc(roles.level));

    if (activeOnly) {
      query = query.where(eq(roles.isActive, true)) as any;
    }

    const rolesList = await query;

    return NextResponse.json(rolesList);
  } catch (error: unknown) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.number().int().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
  permissions: z.array(z.string()).optional(),
});

export const POST = withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
  try {
    const body = await req.json();
    const validated = createRoleSchema.parse(body);

    const [newRole] = await db
      .insert(roles)
      .values({
        name: validated.name,
        level: validated.level,
        description: validated.description || null,
        isActive: validated.isActive ?? true,
        sortOrder: validated.sortOrder ?? 0,
        permissions: Array.isArray(validated.permissions) ? validated.permissions : {},
      })
      .returning();

    if (newRole) {
      await logActivity({
        entityType: "role",
        entityId: newRole.id,
        action: "created",
        details: { name: newRole.name, level: newRole.level, description: newRole.description },
        actorId: user.id,
      });
    }

    return NextResponse.json(newRole, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
