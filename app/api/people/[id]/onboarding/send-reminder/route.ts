import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, personOnboardingProgress, onboardingTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { sendOnboardingReminderEmail } from "@/lib/services/email-service";
import { sanitizeErrorMessage } from "@/lib/utils";

/**
 * POST /api/people/[id]/onboarding/send-reminder
 * Send a reminder email to a person about their pending onboarding tasks
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: personId } = await params;
  return withPermission(Permission.VIEW_ALL_PEOPLE, async () => {
    try {
      // Get person details
      const [person] = await db
        .select({
          id: people.id,
          firstName: people.firstName,
          lastName: people.lastName,
          email: people.email,
          reportsToId: people.reportsToId,
        })
        .from(people)
        .where(eq(people.id, personId))
        .limit(1);

      if (!person) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }

      if (!person.email) {
        return NextResponse.json(
          { error: "Person has no email address" },
          { status: 400 }
        );
      }

      // Get manager name if available
      let managerName: string | undefined;
      if (person.reportsToId) {
        const [manager] = await db
          .select({
            firstName: people.firstName,
            lastName: people.lastName,
          })
          .from(people)
          .where(eq(people.id, person.reportsToId))
          .limit(1);

        if (manager) {
          managerName = `${manager.firstName} ${manager.lastName}`.trim();
        }
      }

      // Count pending tasks
      const pendingTasks = await db
        .select({ taskId: personOnboardingProgress.taskId })
        .from(personOnboardingProgress)
        .innerJoin(onboardingTasks, eq(onboardingTasks.id, personOnboardingProgress.taskId))
        .where(
          and(
            eq(personOnboardingProgress.personId, personId),
            eq(personOnboardingProgress.completed, false),
            eq(onboardingTasks.isActive, true)
          )
        );

      const pendingTaskCount = pendingTasks.length;

      if (pendingTaskCount === 0) {
        return NextResponse.json(
          { error: "Person has no pending onboarding tasks" },
          { status: 400 }
        );
      }

      // Send the reminder email
      const result = await sendOnboardingReminderEmail({
        email: person.email,
        firstName: person.firstName ?? 'Team Member',
        managerName,
        pendingTaskCount,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: sanitizeErrorMessage(result.error ?? "Failed to send email", "Failed to send reminder email. Please try again.") },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        pendingTaskCount,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error sending reminder email:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(message, "Failed to send reminder email. Please try again.") },
        { status: 500 }
      );
    }
  })(req);
}
