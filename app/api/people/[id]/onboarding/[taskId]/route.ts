import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { personOnboardingProgress, people } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: personId, taskId } = await params;
  return withAuth(async (req, user) => {
    try {

    // Get current user's person record
    const [currentUserPerson] = await db
      .select({ id: people.id })
      .from(people)
      .where(eq(people.authUserId, user.id))
      .limit(1);

    if (!currentUserPerson) {
      return NextResponse.json(
        { error: "User not found in system" },
        { status: 404 }
      );
    }

    // Get the current progress record
    const [currentProgress] = await db
      .select()
      .from(personOnboardingProgress)
      .where(
        and(
          eq(personOnboardingProgress.personId, personId),
          eq(personOnboardingProgress.taskId, taskId)
        )
      )
      .limit(1);

    if (!currentProgress) {
      return NextResponse.json(
        { error: "Progress record not found" },
        { status: 404 }
      );
    }

    // Toggle completion status
    const newCompletedStatus = !currentProgress.completed;

    const [updatedProgress] = await db
      .update(personOnboardingProgress)
      .set({
        completed: newCompletedStatus,
        completedAt: newCompletedStatus ? sql`now()` : null,
        completedBy: newCompletedStatus ? currentUserPerson.id : null,
        updatedAt: sql`now()`,
      })
      .where(eq(personOnboardingProgress.id, currentProgress.id))
      .returning();

      return NextResponse.json(updatedProgress);
    } catch (error: any) {
      console.error("Error toggling task completion:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
