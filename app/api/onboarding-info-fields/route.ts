import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { onboardingInfoFields } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { INFO_FIELD_TYPES, INFO_FIELD_CATEGORIES } from "@/lib/db/schema/onboarding-info-fields";

const selectOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const createFieldSchema = z.object({
  fieldName: z.string().min(1).max(100).regex(/^[a-z][a-z0-9_]*$/, {
    message: "Field name must start with a letter and contain only lowercase letters, numbers, and underscores",
  }),
  fieldLabel: z.string().min(1).max(255),
  fieldType: z.enum(INFO_FIELD_TYPES as unknown as [string, ...string[]]),
  fieldOptions: z.array(selectOptionSchema).optional(),
  isRequired: z.boolean().optional().default(false),
  category: z.enum(INFO_FIELD_CATEGORIES as unknown as [string, ...string[]]).optional(),
  displayOrder: z.number().int().min(0),
});

/**
 * GET /api/onboarding-info-fields
 * List all active info fields, ordered by displayOrder
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const category = url.searchParams.get('category');

    const conditions = [];
    if (!includeInactive) {
      conditions.push(eq(onboardingInfoFields.isActive, true));
    }
    if (category) {
      conditions.push(eq(onboardingInfoFields.category, category));
    }

    const baseQuery = db.select().from(onboardingInfoFields);
    const query =
      conditions.length === 0
        ? baseQuery
        : baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));

    const fields = await query.orderBy(asc(onboardingInfoFields.displayOrder));

    return NextResponse.json(fields);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching info fields:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
});

/**
 * POST /api/onboarding-info-fields
 * Create a new info field
 */
export const POST = withPermission(
  Permission.MANAGE_SETTINGS,
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validated = createFieldSchema.parse(body);

      // Check for duplicate field name
      const [existing] = await db
        .select()
        .from(onboardingInfoFields)
        .where(eq(onboardingInfoFields.fieldName, validated.fieldName))
        .limit(1);

      if (existing && existing.isActive) {
        return NextResponse.json(
          { error: "A field with this name already exists" },
          { status: 409 }
        );
      }

      const [newField] = await db
        .insert(onboardingInfoFields)
        .values({
          fieldName: validated.fieldName,
          fieldLabel: validated.fieldLabel,
          fieldType: validated.fieldType,
          fieldOptions: validated.fieldOptions || null,
          isRequired: validated.isRequired,
          category: validated.category || null,
          displayOrder: validated.displayOrder,
          isActive: true,
        })
        .returning();

      return NextResponse.json(newField, { status: 201 });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: (error as z.ZodError).errors },
          { status: 400 }
        );
      }
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error creating info field:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  }
);
