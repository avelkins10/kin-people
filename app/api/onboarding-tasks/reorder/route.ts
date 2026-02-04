import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { onboardingTasks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

const reorderSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1),
});

/**
 * Bulk reorder onboarding tasks.
 * Accepts an array of task IDs in the desired order.
 * Updates taskOrder for each task based on its position in the array.
 */
export const POST = withPermission(
  Permission.MANAGE_SETTINGS,
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validated = reorderSchema.parse(body);

      // Update each task's order in a transaction
      await db.transaction(async (tx) => {
        for (let i = 0; i < validated.taskIds.length; i++) {
          await tx
            .update(onboardingTasks)
            .set({
              taskOrder: i + 1, // 1-based ordering
              updatedAt: sql`now()`,
            })
            .where(eq(onboardingTasks.id, validated.taskIds[i]));
        }
      });

      // Fetch and return the updated tasks
      const tasks = await db
        .select()
        .from(onboardingTasks)
        .where(eq(onboardingTasks.isActive, true))
        .orderBy(onboardingTasks.taskOrder);

      return NextResponse.json(tasks);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: (error as z.ZodError).errors },
          { status: 400 }
        );
      }
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error reordering onboarding tasks:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  }
);
