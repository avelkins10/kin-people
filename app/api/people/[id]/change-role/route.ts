import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  people,
  roles,
  personPayPlans,
  personHistory,
  payPlans,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { requirePermission } from "@/lib/auth/check-permission";
import { getPersonWithDetails } from "@/lib/db/helpers/person-helpers";
import { canManagePerson } from "@/lib/auth/visibility-rules";

const schema = z.object({
  newRoleId: z.string().uuid(),
  effectiveDate: z.string(),
  reason: z.string().min(1),
  updatePayPlan: z.boolean().optional(),
  newPayPlanId: z.string().uuid().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (req, user) => {
    try {
      const body = await req.json();
      const validated = schema.parse(body);

      // Fetch new role to determine required permission (only admins can assign Admin role)
      const [newRoleRow] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, validated.newRoleId))
        .limit(1);
      if (!newRoleRow) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }
      if (newRoleRow.name === "Admin") {
        requirePermission(user, Permission.MANAGE_SETTINGS);
      } else {
        requirePermission(user, Permission.MANAGE_OWN_OFFICE);
      }

      // Fetch current person data
      const currentPerson = await getPersonWithDetails(id);
      if (!currentPerson) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }

      // When not assigning Admin, verify the target person is within the caller's allowed scope
      if (newRoleRow.name !== "Admin") {
        const canManage = await canManagePerson(user, id);
        if (!canManage) {
          return NextResponse.json(
            { error: "You do not have permission to manage this person" },
            { status: 403 }
          );
        }
      }

      // Fetch old role
      const [oldRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, currentPerson.person.roleId))
        .limit(1);

      // Use transaction to ensure atomicity
      await db.transaction(async (tx) => {
        // Update role
        await tx
          .update(people)
          .set({ roleId: validated.newRoleId })
          .where(eq(people.id, id));

        // Handle pay plan update if requested
        if (validated.updatePayPlan && validated.newPayPlanId) {
          // Fetch new pay plan name
          const newPayPlanResult = await tx
            .select()
            .from(payPlans)
            .where(eq(payPlans.id, validated.newPayPlanId))
            .limit(1);
          
          const newPayPlanName = newPayPlanResult[0]?.name || "";

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
          });

          // Create pay plan history record
          const currentPayPlan = currentPerson.currentPayPlan;
          await tx.insert(personHistory).values({
            personId: id,
            changeType: "pay_plan_change",
            previousValue: currentPayPlan
              ? {
                  pay_plan_id: currentPayPlan.payPlan.id,
                  pay_plan_name: currentPayPlan.payPlan.name,
                }
              : null,
            newValue: {
              pay_plan_id: validated.newPayPlanId,
              pay_plan_name: newPayPlanName,
            },
            effectiveDate: validated.effectiveDate,
            reason: validated.reason,
            changedById: user.id,
          });
        }

        // Create role change history record
        await tx.insert(personHistory).values({
          personId: id,
          changeType: "role_change",
          previousValue: {
            role_id: currentPerson.person.roleId,
            role_name: oldRole?.name ?? "",
          },
          newValue: {
            role_id: validated.newRoleId,
            role_name: newRoleRow.name,
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
      console.error("Error changing role:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
