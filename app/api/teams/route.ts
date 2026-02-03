import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { teams, offices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        officeId: teams.officeId,
        teamLeadId: teams.teamLeadId,
        isActive: teams.isActive,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        officeName: offices.name,
      })
      .from(teams)
      .leftJoin(offices, eq(teams.officeId, offices.id));

    if (activeOnly) {
      query = query.where(eq(teams.isActive, true)) as any;
    }

    const teamsList = await query;

    return NextResponse.json(teamsList);
  } catch (error: unknown) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  officeId: z.string().uuid().optional(),
  isActive: z.boolean().optional().default(true),
});

export const POST = withPermission(Permission.MANAGE_OWN_TEAM, async (req, user) => {
  try {
    const body = await req.json();
    const validated = createTeamSchema.parse(body);

    const [newTeam] = await db
      .insert(teams)
      .values({
        name: validated.name,
        description: validated.description || null,
        officeId: validated.officeId || null,
        isActive: validated.isActive ?? true,
      })
      .returning();

    if (newTeam) {
      await logActivity({
        entityType: "team",
        entityId: newTeam.id,
        action: "created",
        details: { name: newTeam.name, officeId: newTeam.officeId },
        actorId: user.id,
      });
    }

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
