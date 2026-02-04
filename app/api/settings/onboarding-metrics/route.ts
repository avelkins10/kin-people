import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  appSettings,
  people,
  onboardingTasks,
  personOnboardingProgress,
  onboardingInfoFields,
  personOnboardingInfo,
} from "@/lib/db/schema";
import { eq, and, sql, count, countDistinct } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

const KEYS = {
  trainingCompleteLabel: "onboarding_metric_training_complete_label",
  trainingCompleteType: "onboarding_metric_training_complete_type",
  readyForFieldLabel: "onboarding_metric_ready_for_field_label",
  readyForFieldType: "onboarding_metric_ready_for_field_type",
} as const;

const DEFAULT_CONFIG = {
  trainingComplete: { label: "Training Complete", type: "placeholder" as const },
  readyForField: { label: "Ready for Field", type: "placeholder" as const },
};

export const GET = withAuth(async () => {
  try {
    const rows = await db.select().from(appSettings);

    const byKey: Record<string, string> = {};
    for (const row of rows) {
      if (row.key && row.value != null) byKey[row.key] = row.value;
    }

    const trainingCompleteLabel =
      byKey[KEYS.trainingCompleteLabel] ?? DEFAULT_CONFIG.trainingComplete.label;
    const trainingCompleteType =
      (byKey[KEYS.trainingCompleteType] as "count" | "percentage" | "placeholder") ??
      DEFAULT_CONFIG.trainingComplete.type;
    const readyForFieldLabel =
      byKey[KEYS.readyForFieldLabel] ?? DEFAULT_CONFIG.readyForField.label;
    const readyForFieldType =
      (byKey[KEYS.readyForFieldType] as "count" | "percentage" | "placeholder") ??
      DEFAULT_CONFIG.readyForField.type;

    // Calculate actual metrics
    let trainingCompleteCount = 0;
    let trainingCompletePercentage = 0;
    let readyForFieldCount = 0;
    let readyForFieldPercentage = 0;

    // Get all people in onboarding status
    const onboardingPeople = await db
      .select({ id: people.id })
      .from(people)
      .where(eq(people.status, "onboarding"));

    const totalOnboarding = onboardingPeople.length;

    if (totalOnboarding > 0) {
      // Get all active training tasks
      const trainingTasks = await db
        .select({ id: onboardingTasks.id })
        .from(onboardingTasks)
        .where(and(eq(onboardingTasks.isActive, true), eq(onboardingTasks.category, "training")));

      const totalTrainingTasks = trainingTasks.length;
      const trainingTaskIds = trainingTasks.map((t) => t.id);

      // Calculate Training Complete metric
      if (totalTrainingTasks > 0) {
        // For each onboarding person, check if they've completed all training tasks
        for (const person of onboardingPeople) {
          const completedTraining = await db
            .select({ taskId: personOnboardingProgress.taskId })
            .from(personOnboardingProgress)
            .where(
              and(
                eq(personOnboardingProgress.personId, person.id),
                eq(personOnboardingProgress.completed, true)
              )
            );

          const completedTrainingIds = completedTraining.map((t) => t.taskId);
          const allTrainingDone = trainingTaskIds.every((id) => completedTrainingIds.includes(id));

          if (allTrainingDone) {
            trainingCompleteCount++;
          }
        }
        trainingCompletePercentage = Math.round((trainingCompleteCount / totalOnboarding) * 100);
      }

      // Get all active tasks (for ready for field)
      const allActiveTasks = await db
        .select({ id: onboardingTasks.id })
        .from(onboardingTasks)
        .where(eq(onboardingTasks.isActive, true));

      const totalActiveTasks = allActiveTasks.length;
      const allTaskIds = allActiveTasks.map((t) => t.id);

      // Get required info fields
      const requiredFields = await db
        .select({ id: onboardingInfoFields.id })
        .from(onboardingInfoFields)
        .where(and(eq(onboardingInfoFields.isActive, true), eq(onboardingInfoFields.isRequired, true)));

      const requiredFieldIds = requiredFields.map((f) => f.id);

      // Calculate Ready for Field metric
      for (const person of onboardingPeople) {
        // Check all tasks completed
        let allTasksDone = false;
        if (totalActiveTasks > 0) {
          const completedTasks = await db
            .select({ taskId: personOnboardingProgress.taskId })
            .from(personOnboardingProgress)
            .where(
              and(
                eq(personOnboardingProgress.personId, person.id),
                eq(personOnboardingProgress.completed, true)
              )
            );

          const completedTaskIds = completedTasks.map((t) => t.taskId);
          allTasksDone = allTaskIds.every((id) => completedTaskIds.includes(id));
        } else {
          // No tasks configured, consider tasks complete
          allTasksDone = true;
        }

        // Check all required info fields submitted
        let allInfoComplete = false;
        if (requiredFieldIds.length > 0) {
          const submittedInfo = await db
            .select({ fieldId: personOnboardingInfo.fieldId })
            .from(personOnboardingInfo)
            .where(
              and(
                eq(personOnboardingInfo.personId, person.id),
                sql`${personOnboardingInfo.fieldValue} IS NOT NULL AND ${personOnboardingInfo.fieldValue} != ''`
              )
            );

          const submittedFieldIds = submittedInfo.map((f) => f.fieldId);
          allInfoComplete = requiredFieldIds.every((id) => submittedFieldIds.includes(id));
        } else {
          // No required fields, consider info complete
          allInfoComplete = true;
        }

        if (allTasksDone && allInfoComplete) {
          readyForFieldCount++;
        }
      }
      readyForFieldPercentage = Math.round((readyForFieldCount / totalOnboarding) * 100);
    }

    return NextResponse.json({
      trainingComplete: {
        label: trainingCompleteLabel,
        type: trainingCompleteType,
        count: trainingCompleteCount,
        percentage: trainingCompletePercentage,
      },
      readyForField: {
        label: readyForFieldLabel,
        type: readyForFieldType,
        count: readyForFieldCount,
        percentage: readyForFieldPercentage,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching onboarding metrics config:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

const patchSchema = z.object({
  trainingComplete: z
    .object({
      label: z.string().min(1).max(100),
      type: z.enum(["count", "percentage", "placeholder"]),
    })
    .optional(),
  readyForField: z
    .object({
      label: z.string().min(1).max(100),
      type: z.enum(["count", "percentage", "placeholder"]),
    })
    .optional(),
});

export const PATCH = withPermission(
  Permission.MANAGE_SETTINGS,
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validated = patchSchema.parse(body);

      async function upsert(key: string, value: string) {
        const existing = await db
          .select()
          .from(appSettings)
          .where(eq(appSettings.key, key))
          .limit(1);
        if (existing.length > 0) {
          await db
            .update(appSettings)
            .set({ value, updatedAt: new Date() })
            .where(eq(appSettings.key, key));
        } else {
          await db.insert(appSettings).values({ key, value });
        }
      }

      if (validated.trainingComplete) {
        await upsert(KEYS.trainingCompleteLabel, validated.trainingComplete.label);
        await upsert(KEYS.trainingCompleteType, validated.trainingComplete.type);
      }
      if (validated.readyForField) {
        await upsert(KEYS.readyForFieldLabel, validated.readyForField.label);
        await upsert(KEYS.readyForFieldType, validated.readyForField.type);
      }

      return NextResponse.json({ ok: true });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating onboarding metrics config:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  }
);
