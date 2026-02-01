import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { personPayPlans, payPlans, personHistory } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { getPersonWithDetails, createPersonHistoryRecord } from "@/lib/db/helpers/person-helpers";
import { canManagePerson } from "@/lib/auth/visibility-rules";

const schema = z.object({
  newPayPlanId: z.string().uuid(),
  effectiveDate: z.string(),
  reason: z.string().min(1),
  notes: z.string().optional(),
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

      // Fetch new pay plan and validate it exists and is active
      const newPayPlan = await db
        .select()
        .from(payPlans)
        .where(eq(payPlans.id, validated.newPayPlanId))
        .limit(1);

      if (!newPayPlan[0]) {
        return NextResponse.json(
          { error: "Pay plan not found" },
          { status: 404 }
        );
      }

      if (!newPayPlan[0].isActive) {
        return NextResponse.json(
          { error: "Cannot assign inactive pay plan to a person" },
          { status: 400 }
        );
      }

      // Use transaction to ensure atomicity
      await db.transaction(async (tx) => {
        // End current pay plan
        await tx
          .update(personPayPlans)
          .set({ endDate: validated.effectiveDate })
          .where(
            and(
              eq(personPayPlans.personId, id),
              isNull(personPayPlans.endDate)
            )
          );

        // Create new pay plan
        await tx.insert(personPayPlans).values({
          personId: id,
          payPlanId: validated.newPayPlanId,
          effectiveDate: validated.effectiveDate,
          notes: validated.notes || null,
        });

        // Create history record
        await tx.insert(personHistory).values({
          personId: id,
          changeType: "pay_plan_change",
          previousValue: currentPerson.currentPayPlan
            ? {
                pay_plan_id: currentPerson.currentPayPlan.payPlan.id,
                pay_plan_name: currentPerson.currentPayPlan.payPlan.name,
              }
            : null,
          newValue: {
            pay_plan_id: validated.newPayPlanId,
            pay_plan_name: newPayPlan[0].name,
          },
          effectiveDate: validated.effectiveDate,
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
      console.error("Error changing pay plan:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
