import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { personTeams, teams, personHistory } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { createPersonHistoryRecord, getPersonWithDetails } from "@/lib/db/helpers/person-helpers";
import { canManagePerson } from "@/lib/auth/visibility-rules";

const schema = z.object({
  teamId: z.string().uuid(),
  roleInTeam: z.enum(["member", "lead", "co-lead"]),
  effectiveDate: z.string(),
  reason: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_OWN_OFFICE, async (req, user) => {
    try {
      const body = await req.json();
      const validated = schema.parse(body);

      // Fetch current person data to verify scope
      const currentPerson = await getPersonWithDetails(id);
      if (!currentPerson) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }

      // Verify the target person is within the caller's allowed scope
      const canManage = await canManagePerson(user, id);
      if (!canManage) {
        return NextResponse.json(
          { error: "You do not have permission to manage this person" },
          { status: 403 }
        );
      }

      // Check if person is already on the team
      const existingMembership = await db
        .select()
        .from(personTeams)
        .where(
          and(
            eq(personTeams.personId, id),
            eq(personTeams.teamId, validated.teamId),
            isNull(personTeams.endDate)
          )
        )
        .limit(1);

      if (existingMembership.length > 0) {
        return NextResponse.json(
          { error: "Person is already a member of this team" },
          { status: 400 }
        );
      }

      // Fetch team name
      const team = await db
        .select()
        .from(teams)
        .where(eq(teams.id, validated.teamId))
        .limit(1);

      if (!team[0]) {
        return NextResponse.json(
          { error: "Team not found" },
          { status: 404 }
        );
      }

      // Create team membership
      await db.insert(personTeams).values({
        personId: id,
        teamId: validated.teamId,
        roleInTeam: validated.roleInTeam,
        effectiveDate: validated.effectiveDate,
      });

      // Create history record
      await createPersonHistoryRecord({
        personId: id,
        changeType: "team_join",
        previousValue: null,
        newValue: {
          team_id: validated.teamId,
          team_name: team[0].name,
          role_in_team: validated.roleInTeam,
        },
        effectiveDate: validated.effectiveDate,
        reason: validated.reason,
        changedById: user.id,
      });

      return NextResponse.json({
        success: true,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error adding to team:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
