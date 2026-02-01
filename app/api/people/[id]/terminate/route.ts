import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  people,
  personPayPlans,
  personTeams,
  personHistory,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { getPersonWithDetails, createPersonHistoryRecord } from "@/lib/db/helpers/person-helpers";
import { canManagePerson } from "@/lib/auth/visibility-rules";

const schema = z.object({
  terminationDate: z.string(),
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

      // Use transaction to ensure atomicity
      await db.transaction(async (tx) => {
        // Update person status
        await tx
          .update(people)
          .set({
            status: "terminated",
            terminationDate: validated.terminationDate,
          })
          .where(eq(people.id, id));

        // End all active pay plans
        await tx
          .update(personPayPlans)
          .set({ endDate: validated.terminationDate })
          .where(
            and(
              eq(personPayPlans.personId, id),
              isNull(personPayPlans.endDate)
            )
          );

        // End all active team memberships
        await tx
          .update(personTeams)
          .set({ endDate: validated.terminationDate })
          .where(
            and(
              eq(personTeams.personId, id),
              isNull(personTeams.endDate)
            )
          );

        // Create history record
        await tx.insert(personHistory).values({
          personId: id,
          changeType: "terminated",
          previousValue: {
            status: currentPerson.person.status,
          },
          newValue: {
            status: "terminated",
            termination_date: validated.terminationDate,
          },
          effectiveDate: validated.terminationDate,
          reason: validated.reason,
          changedById: user.id,
        });
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
      console.error("Error terminating person:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
