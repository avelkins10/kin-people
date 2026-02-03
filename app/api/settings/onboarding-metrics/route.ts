import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

    return NextResponse.json({
      trainingComplete: { label: trainingCompleteLabel, type: trainingCompleteType },
      readyForField: { label: readyForFieldLabel, type: readyForFieldType },
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
