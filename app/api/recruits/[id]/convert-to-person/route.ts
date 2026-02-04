import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { canManageRecruit } from "@/lib/auth/visibility-rules";
import { getRecruitWithDetails } from "@/lib/db/helpers/recruit-helpers";
import { db } from "@/lib/db";
import {
  recruits,
  recruitHistory,
  people,
  personPayPlans,
  personTeams,
  personHistory,
  onboardingTasks,
  personOnboardingProgress,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateKinId } from "@/lib/db/helpers/kin-id-helpers";
import {
  normalizePhone,
  checkForDuplicatePerson,
  formatDuplicateError,
} from "@/lib/db/helpers/duplicate-helpers";
import { sendWelcomeEmail } from "@/lib/services/email-service";

const convertSchema = z.object({
  hireDate: z.string(), // ISO date string
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_OWN_OFFICE, async (req, user) => {
    try {
      const body = await req.json();
      const validated = convertSchema.parse(body);

      // Check management permission
      const canManage = await canManageRecruit(user, id);
      if (!canManage) {
        return NextResponse.json(
          { error: "You do not have permission to manage this recruit" },
          { status: 403 }
        );
      }

      // Fetch recruit with all details
      const recruitData = await getRecruitWithDetails(id);
      if (!recruitData) {
        return NextResponse.json(
          { error: "Recruit not found" },
          { status: 404 }
        );
      }

      const { recruit, targetOffice, targetRole, targetPayPlan, targetTeam, targetReportsTo } =
        recruitData;

      // Verify recruit is in correct status
      if (recruit.status !== "agreement_signed") {
        return NextResponse.json(
          { error: "Recruit must be in 'agreement_signed' status to convert" },
          { status: 400 }
        );
      }

      // Verify required fields
      if (!targetOffice || !targetRole) {
        return NextResponse.json(
          { error: "Target office and role are required for conversion" },
          { status: 400 }
        );
      }

      // Check for duplicate person before conversion
      if (recruit.email) {
        const duplicatePerson = await checkForDuplicatePerson(
          recruit.email,
          recruit.phone
        );
        if (duplicatePerson.isDuplicate) {
          return NextResponse.json(
            { error: formatDuplicateError(duplicatePerson, "person") },
            { status: 409 }
          );
        }
      }

      // Use transaction to create person and update recruit
      const result = await db.transaction(async (tx) => {
        // Generate KIN ID for the new person
        const kinId = await generateKinId(tx);

        // Normalize phone for storage
        const normalizedPhone = normalizePhone(recruit.phone);

        // Create person record
        const [newPerson] = await tx
          .insert(people)
          .values({
            kinId,
            firstName: recruit.firstName ?? "",
            lastName: recruit.lastName ?? "",
            email: recruit.email ?? "",
            phone: recruit.phone ?? null,
            normalizedPhone,
            officeId: targetOffice.id,
            roleId: targetRole.id,
            reportsToId: targetReportsTo?.id ?? null,
            recruitedById: recruit.recruiterId ?? null,
            status: "onboarding",
            hireDate: validated.hireDate,
          })
          .returning();

        // Create person pay plan record
        if (targetPayPlan) {
          await tx.insert(personPayPlans).values({
            personId: newPerson.id,
            payPlanId: targetPayPlan.id,
            effectiveDate: validated.hireDate,
            notes: "Assigned from recruit conversion",
          });
        }

        // Create person team record if applicable
        if (targetTeam) {
          await tx.insert(personTeams).values({
            personId: newPerson.id,
            teamId: targetTeam.id,
            roleInTeam: "member",
            effectiveDate: validated.hireDate,
          });
        }

        // Create person history record
        await tx.insert(personHistory).values({
          personId: newPerson.id,
          changeType: "hired",
          previousValue: null,
          newValue: {
            office_id: targetOffice.id,
            office_name: targetOffice.name,
            role_id: targetRole.id,
            role_name: targetRole.name,
            hire_date: validated.hireDate,
          },
          effectiveDate: validated.hireDate,
          reason: "Converted from recruit",
          changedById: user.id,
        });

        // Update recruit
        await tx
          .update(recruits)
          .set({
            convertedToPersonId: newPerson.id,
            convertedAt: new Date(),
            status: "converted",
            updatedAt: new Date(),
          })
          .where(eq(recruits.id, id));

        // Create recruit history record
        await tx.insert(recruitHistory).values({
          recruitId: id,
          previousStatus: "agreement_signed",
          newStatus: "converted",
          notes: `Converted to person: ${newPerson.id}`,
          changedById: user.id,
        });

        // Initialize onboarding tasks
        const activeTasks = await tx
          .select({ id: onboardingTasks.id })
          .from(onboardingTasks)
          .where(eq(onboardingTasks.isActive, true));

        if (activeTasks.length > 0) {
          const progressRecords = activeTasks.map((task) => ({
            personId: newPerson.id,
            taskId: task.id,
            completed: false,
          }));
          await tx
            .insert(personOnboardingProgress)
            .values(progressRecords)
            .onConflictDoNothing();
        }

        return newPerson;
      });

      // Send welcome email to the new hire (async, don't block on failure)
      if (recruit.email) {
        sendWelcomeEmail({
          email: recruit.email,
          firstName: recruit.firstName ?? '',
          lastName: recruit.lastName ?? undefined,
          managerName: targetReportsTo
            ? `${targetReportsTo.firstName} ${targetReportsTo.lastName}`.trim()
            : undefined,
          officeName: targetOffice?.name,
        }).then((emailResult) => {
          if (emailResult.success) {
            console.log(`[convert-to-person] Welcome email sent to ${recruit.email}`);
          } else {
            console.warn(`[convert-to-person] Failed to send welcome email: ${emailResult.error}`);
          }
        }).catch((err) => {
          console.warn('[convert-to-person] Welcome email error:', err);
        });
      }

      return NextResponse.json({
        success: true,
        personId: result.id,
        kinId: result.kinId,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error converting recruit to person:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
