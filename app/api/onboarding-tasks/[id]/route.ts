import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { onboardingTasks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import {
  TASK_TYPES,
  AUTOMATION_TYPES,
  ASSIGNEE_TYPES,
  TASK_CATEGORIES,
} from "@/lib/db/schema/onboarding-tasks";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  category: z.enum(TASK_CATEGORIES as unknown as [string, ...string[]]).optional(),
  taskOrder: z.number().int().min(0).optional(),
  taskType: z.enum(TASK_TYPES as unknown as [string, ...string[]]).optional(),
  requiresInput: z.boolean().optional(),
  inputFields: z.any().optional(),
  isAutomated: z.boolean().optional(),
  automationType: z.enum(AUTOMATION_TYPES as unknown as [string, ...string[]]).nullable().optional(),
  automationConfig: z.any().optional(),
  assigneeType: z.enum(ASSIGNEE_TYPES as unknown as [string, ...string[]]).optional(),
  dueDays: z.number().int().min(0).nullable().optional(),
  blockedBy: z.array(z.string().uuid()).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.VIEW_ALL_PEOPLE, async () => {
    try {
      const [task] = await db
        .select()
        .from(onboardingTasks)
        .where(eq(onboardingTasks.id, id))
        .limit(1);

      if (!task) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(task);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error fetching onboarding task:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (innerReq) => {
    try {
      const body = await innerReq.json();
      const validated = updateTaskSchema.parse(body);

      // Check if task exists
      const [existingTask] = await db
        .select()
        .from(onboardingTasks)
        .where(eq(onboardingTasks.id, id))
        .limit(1);

      if (!existingTask) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      // Build update object with only provided fields
      const updateData: Record<string, unknown> = {
        updatedAt: sql`now()`,
      };

      if (validated.title !== undefined) updateData.title = validated.title;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.category !== undefined) updateData.category = validated.category;
      if (validated.taskOrder !== undefined) updateData.taskOrder = validated.taskOrder;
      if (validated.taskType !== undefined) updateData.taskType = validated.taskType;
      if (validated.requiresInput !== undefined) updateData.requiresInput = validated.requiresInput;
      if (validated.inputFields !== undefined) updateData.inputFields = validated.inputFields;
      if (validated.isAutomated !== undefined) updateData.isAutomated = validated.isAutomated;
      if (validated.automationType !== undefined) updateData.automationType = validated.automationType;
      if (validated.automationConfig !== undefined) updateData.automationConfig = validated.automationConfig;
      if (validated.assigneeType !== undefined) updateData.assigneeType = validated.assigneeType;
      if (validated.dueDays !== undefined) updateData.dueDays = validated.dueDays;
      if (validated.blockedBy !== undefined) updateData.blockedBy = validated.blockedBy;
      if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

      const [updatedTask] = await db
        .update(onboardingTasks)
        .set(updateData)
        .where(eq(onboardingTasks.id, id))
        .returning();

      return NextResponse.json(updatedTask);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: (error as z.ZodError).errors },
          { status: 400 }
        );
      }
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error updating onboarding task:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async () => {
    try {
      // Check if task exists
      const [existingTask] = await db
        .select()
        .from(onboardingTasks)
        .where(eq(onboardingTasks.id, id))
        .limit(1);

      if (!existingTask) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      // Soft delete by setting isActive to false
      const [deletedTask] = await db
        .update(onboardingTasks)
        .set({
          isActive: false,
          updatedAt: sql`now()`,
        })
        .where(eq(onboardingTasks.id, id))
        .returning();

      return NextResponse.json(deletedTask);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error deleting onboarding task:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}
