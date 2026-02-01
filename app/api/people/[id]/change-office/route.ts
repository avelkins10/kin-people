import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { people, offices, personHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { getPersonWithDetails, createPersonHistoryRecord } from "@/lib/db/helpers/person-helpers";
import { canManagePerson } from "@/lib/auth/visibility-rules";

const schema = z.object({
  newOfficeId: z.string().uuid(),
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

      // Fetch old and new office names
      const [oldOffice, newOffice] = await Promise.all([
        currentPerson.person.officeId
          ? db.select().from(offices).where(eq(offices.id, currentPerson.person.officeId)).limit(1)
          : Promise.resolve([]),
        db.select().from(offices).where(eq(offices.id, validated.newOfficeId)).limit(1),
      ]);

      // Update office
      await db
        .update(people)
        .set({ officeId: validated.newOfficeId })
        .where(eq(people.id, id));

      // Create history record
      await createPersonHistoryRecord({
        personId: id,
        changeType: "office_change",
        previousValue: oldOffice[0]
          ? {
              office_id: oldOffice[0].id,
              office_name: oldOffice[0].name,
            }
          : null,
        newValue: {
          office_id: validated.newOfficeId,
          office_name: newOffice[0]?.name || "",
        },
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
      console.error("Error changing office:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
