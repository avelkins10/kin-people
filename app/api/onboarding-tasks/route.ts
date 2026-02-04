import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { onboardingTasks, people } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().min(1),
  taskOrder: z.number().int().min(0),
});

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const tasks = await db
      .select()
      .from(onboardingTasks)
      .where(eq(onboardingTasks.isActive, true))
      .orderBy(onboardingTasks.taskOrder);

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("Error fetching onboarding tasks:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withPermission(
  Permission.VIEW_ALL_PEOPLE,
  async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const validated = createTaskSchema.parse(body);

      // Verify that the user exists in the people table
      const [userExists] = await db
        .select({ id: people.id })
        .from(people)
        .where(eq(people.authUserId, user.id))
        .limit(1);

      if (!userExists) {
        return NextResponse.json(
          { error: "User not found in system" },
          { status: 404 }
        );
      }

      const [newTask] = await db
        .insert(onboardingTasks)
        .values({
          title: validated.title,
          description: validated.description || null,
          category: validated.category,
          taskOrder: validated.taskOrder,
          isActive: true,
        })
        .returning();

      return NextResponse.json(newTask, { status: 201 });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error creating onboarding task:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }
);
