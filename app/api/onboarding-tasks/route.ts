import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { onboardingTasks, people } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import {
  TASK_TYPES,
  AUTOMATION_TYPES,
  ASSIGNEE_TYPES,
  TASK_CATEGORIES,
} from "@/lib/db/schema/onboarding-tasks";

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(TASK_CATEGORIES as unknown as [string, ...string[]]),
  taskOrder: z.number().int().min(0),
  // New fields
  taskType: z.enum(TASK_TYPES as unknown as [string, ...string[]]).optional().default('manual'),
  requiresInput: z.boolean().optional().default(false),
  inputFields: z.any().optional(), // JSON schema for input fields
  isAutomated: z.boolean().optional().default(false),
  automationType: z.enum(AUTOMATION_TYPES as unknown as [string, ...string[]]).optional(),
  automationConfig: z.any().optional(), // JSON config for automation
  assigneeType: z.enum(ASSIGNEE_TYPES as unknown as [string, ...string[]]).optional().default('new_hire'),
  dueDays: z.number().int().min(0).optional(),
  blockedBy: z.array(z.string().uuid()).optional(),
});

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    let query = db.select().from(onboardingTasks);

    if (!includeInactive) {
      query = query.where(eq(onboardingTasks.isActive, true)) as typeof query;
    }

    const tasks = await query.orderBy(asc(onboardingTasks.taskOrder));

    return NextResponse.json(tasks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching onboarding tasks:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
});

export const POST = withPermission(
  Permission.MANAGE_SETTINGS,
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
          taskType: validated.taskType,
          requiresInput: validated.requiresInput,
          inputFields: validated.inputFields || null,
          isAutomated: validated.isAutomated,
          automationType: validated.automationType || null,
          automationConfig: validated.automationConfig || null,
          assigneeType: validated.assigneeType,
          dueDays: validated.dueDays ?? null,
          blockedBy: validated.blockedBy || null,
          isActive: true,
        })
        .returning();

      return NextResponse.json(newTask, { status: 201 });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: (error as z.ZodError).errors },
          { status: 400 }
        );
      }
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error creating onboarding task:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  }
);
