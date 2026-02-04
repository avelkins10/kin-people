import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboardingTasks, personOnboardingProgress, people } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: personId } = await params;
  return withAuth(async (req, user) => {
    try {
      // Verify person exists
      const [person] = await db
        .select({ id: people.id })
        .from(people)
        .where(eq(people.id, personId))
        .limit(1);

      if (!person) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }

      // Get all active tasks with their progress for this person
      const tasksWithProgress = await db
        .select({
          id: onboardingTasks.id,
          title: onboardingTasks.title,
          description: onboardingTasks.description,
          category: onboardingTasks.category,
          taskOrder: onboardingTasks.taskOrder,
          completed: sql<boolean>`COALESCE(${personOnboardingProgress.completed}, false)`,
          completedAt: personOnboardingProgress.completedAt,
          completedBy: personOnboardingProgress.completedBy,
          notes: personOnboardingProgress.notes,
        })
        .from(onboardingTasks)
        .leftJoin(
          personOnboardingProgress,
          and(
            eq(personOnboardingProgress.taskId, onboardingTasks.id),
            eq(personOnboardingProgress.personId, personId)
          )
        )
        .where(eq(onboardingTasks.isActive, true))
        .orderBy(onboardingTasks.taskOrder);

      // Calculate stats
      const completedCount = tasksWithProgress.filter((task) => task.completed).length;
      const totalCount = tasksWithProgress.length;
      const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return NextResponse.json({
        tasks: tasksWithProgress,
        completedCount,
        totalCount,
        percentComplete,
      });
    } catch (error: any) {
      console.error("Error fetching onboarding progress:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: personId } = await params;
  return withAuth(async (req, user) => {
    try {
      // Verify person exists
      const [person] = await db
        .select({ id: people.id })
        .from(people)
        .where(eq(people.id, personId))
        .limit(1);

      if (!person) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }

      // Get all active tasks
      const activeTasks = await db
        .select({ id: onboardingTasks.id })
        .from(onboardingTasks)
        .where(eq(onboardingTasks.isActive, true));

      if (activeTasks.length === 0) {
        return NextResponse.json({
          message: "No active tasks to initialize",
          count: 0,
        });
      }

      // Create progress records for all active tasks
      const progressRecords = activeTasks.map((task) => ({
        personId,
        taskId: task.id,
        completed: false,
      }));

      await db
        .insert(personOnboardingProgress)
        .values(progressRecords)
        .onConflictDoNothing();

      return NextResponse.json(
        {
          message: "Onboarding initialized successfully",
          count: activeTasks.length,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error("Error initializing onboarding:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
