import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { canManagePerson } from "@/lib/auth/visibility-rules";
import { db } from "@/lib/db";
import { people, personOnboardingProgress, onboardingTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendOnboardingCompleteEmail } from "@/lib/services/email-service";

/**
 * POST /api/people/[id]/onboarding/complete
 *
 * Completes onboarding for a person:
 * - Verifies person exists and has status "onboarding"
 * - Checks if all onboarding tasks are complete
 * - Updates person status to "active"
 * - Sends completion email to the person (and CC's their manager)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_OWN_OFFICE, async (req, user) => {
    try {
      // Check management permission
      const canManage = await canManagePerson(user, id);
      if (!canManage) {
        return NextResponse.json(
          { error: "You do not have permission to manage this person" },
          { status: 403 }
        );
      }

      // Fetch the person with their manager info
      const [person] = await db
        .select({
          id: people.id,
          firstName: people.firstName,
          lastName: people.lastName,
          email: people.email,
          status: people.status,
          reportsToId: people.reportsToId,
        })
        .from(people)
        .where(eq(people.id, id))
        .limit(1);

      if (!person) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }

      // Verify person is in onboarding status
      if (person.status !== "onboarding") {
        return NextResponse.json(
          { error: "Person is not currently in onboarding status" },
          { status: 400 }
        );
      }

      // Check if all tasks are complete
      const incompleteTaskCount = await db
        .select({ id: personOnboardingProgress.id })
        .from(personOnboardingProgress)
        .innerJoin(
          onboardingTasks,
          eq(personOnboardingProgress.taskId, onboardingTasks.id)
        )
        .where(
          and(
            eq(personOnboardingProgress.personId, id),
            eq(personOnboardingProgress.completed, false),
            eq(onboardingTasks.isActive, true)
          )
        );

      if (incompleteTaskCount.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot complete onboarding: ${incompleteTaskCount.length} task(s) remaining`,
            incompleteCount: incompleteTaskCount.length,
          },
          { status: 400 }
        );
      }

      // Get manager info for the email
      let managerName: string | undefined;
      let managerEmail: string | undefined;
      if (person.reportsToId) {
        const [manager] = await db
          .select({
            firstName: people.firstName,
            lastName: people.lastName,
            email: people.email,
          })
          .from(people)
          .where(eq(people.id, person.reportsToId))
          .limit(1);

        if (manager) {
          managerName = `${manager.firstName} ${manager.lastName}`.trim();
          managerEmail = manager.email || undefined;
        }
      }

      // Update person status to "active"
      const [updatedPerson] = await db
        .update(people)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(people.id, id))
        .returning();

      console.log(
        `[complete-onboarding] Person ${id} status changed from onboarding to active`
      );

      // Send completion email (async, don't block on failure)
      if (person.email) {
        sendOnboardingCompleteEmail({
          email: person.email,
          firstName: person.firstName,
          managerName,
          managerEmail,
        })
          .then((emailResult) => {
            if (emailResult.success) {
              console.log(
                `[complete-onboarding] Completion email sent to ${person.email}`
              );
            } else {
              console.warn(
                `[complete-onboarding] Failed to send completion email: ${emailResult.error}`
              );
            }
          })
          .catch((err) => {
            console.warn("[complete-onboarding] Completion email error:", err);
          });
      }

      return NextResponse.json({
        success: true,
        person: {
          id: updatedPerson.id,
          firstName: updatedPerson.firstName,
          lastName: updatedPerson.lastName,
          status: updatedPerson.status,
        },
      });
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
