import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { people, personHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { getPersonWithDetails, createPersonHistoryRecord } from "@/lib/db/helpers/person-helpers";
import { canManagePerson } from "@/lib/auth/visibility-rules";

const schema = z.object({
  newManagerId: z.string().uuid().nullable(),
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

      // Prevent self-assignment
      if (validated.newManagerId === id) {
        return NextResponse.json(
          { error: "Person cannot report to themselves" },
          { status: 400 }
        );
      }

      // Fetch current person data
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

      // Fetch old and new manager names
      const oldManager = currentPerson.manager;
      let newManager = null;
      if (validated.newManagerId) {
        const managerData = await db
          .select({
            id: people.id,
            firstName: people.firstName,
            lastName: people.lastName,
          })
          .from(people)
          .where(eq(people.id, validated.newManagerId))
          .limit(1);
        newManager = managerData[0] || null;
      }

      // Update manager
      await db
        .update(people)
        .set({ reportsToId: validated.newManagerId })
        .where(eq(people.id, id));

      // Create history record
      await createPersonHistoryRecord({
        personId: id,
        changeType: "reports_to_change",
        previousValue: oldManager
          ? {
              manager_id: oldManager.id,
              manager_name: `${oldManager.firstName} ${oldManager.lastName}`,
            }
          : null,
        newValue: newManager
          ? {
              manager_id: newManager.id,
              manager_name: `${newManager.firstName} ${newManager.lastName}`,
            }
          : null,
        effectiveDate: validated.effectiveDate,
        reason: validated.reason,
        changedById: user.id,
      });

      // Fetch updated person data
      const updatedPerson = await getPersonWithDetails(id);

      return NextResponse.json({
        success: true,
        person: updatedPerson,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error changing manager:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
