import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { offices } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";
import { getAccessibleOfficeIds } from "@/lib/auth/visibility-rules";

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const scoped = searchParams.get("scoped") === "true";

    const conditions: any[] = [];

    if (activeOnly) {
      conditions.push(eq(offices.isActive, true));
    }

    if (scoped) {
      const accessibleIds = await getAccessibleOfficeIds(user);
      if (accessibleIds !== null) {
        if (accessibleIds.length === 0) {
          return NextResponse.json([]);
        }
        conditions.push(inArray(offices.id, accessibleIds));
      }
    }

    let query = db.select().from(offices);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const officesList = await query;

    return NextResponse.json(officesList);
  } catch (error: unknown) {
    console.error("Error fetching offices:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

const createOfficeSchema = z.object({
  name: z.string().min(1).max(100),
  region: z.string().optional(),
  regionId: z.string().uuid().nullable().optional(),
  division: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const POST = withPermission(Permission.MANAGE_ALL_OFFICES, async (req, user) => {
  try {
    const body = await req.json();
    const validated = createOfficeSchema.parse(body);

    const [newOffice] = await db
      .insert(offices)
      .values({
        name: validated.name,
        region: validated.region || null,
        regionId: validated.regionId || null,
        division: validated.division || null,
        address: validated.address || null,
        isActive: validated.isActive ?? true,
      })
      .returning();

    if (newOffice) {
      await logActivity({
        entityType: "office",
        entityId: newOffice.id,
        action: "created",
        details: { name: newOffice.name, region: newOffice.region, division: newOffice.division, address: newOffice.address },
        actorId: user.id,
      });
    }

    return NextResponse.json(newOffice, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating office:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
