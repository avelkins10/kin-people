import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { onboardingInfoFields } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { INFO_FIELD_TYPES, INFO_FIELD_CATEGORIES } from "@/lib/db/schema/onboarding-info-fields";

const selectOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const updateFieldSchema = z.object({
  fieldName: z.string().min(1).max(100).regex(/^[a-z][a-z0-9_]*$/, {
    message: "Field name must start with a letter and contain only lowercase letters, numbers, and underscores",
  }).optional(),
  fieldLabel: z.string().min(1).max(255).optional(),
  fieldType: z.enum(INFO_FIELD_TYPES as unknown as [string, ...string[]]).optional(),
  fieldOptions: z.array(selectOptionSchema).nullable().optional(),
  isRequired: z.boolean().optional(),
  category: z.enum(INFO_FIELD_CATEGORIES as unknown as [string, ...string[]]).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/onboarding-info-fields/[id]
 * Get a single info field by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.VIEW_ALL_PEOPLE, async () => {
    try {
      const [field] = await db
        .select()
        .from(onboardingInfoFields)
        .where(eq(onboardingInfoFields.id, id))
        .limit(1);

      if (!field) {
        return NextResponse.json(
          { error: "Field not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(field);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error fetching info field:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * PATCH /api/onboarding-info-fields/[id]
 * Update an info field
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (innerReq) => {
    try {
      const body = await innerReq.json();
      const validated = updateFieldSchema.parse(body);

      // Check if field exists
      const [existingField] = await db
        .select()
        .from(onboardingInfoFields)
        .where(eq(onboardingInfoFields.id, id))
        .limit(1);

      if (!existingField) {
        return NextResponse.json(
          { error: "Field not found" },
          { status: 404 }
        );
      }

      // If field name is being changed, check for duplicates
      if (validated.fieldName && validated.fieldName !== existingField.fieldName) {
        const [duplicate] = await db
          .select()
          .from(onboardingInfoFields)
          .where(eq(onboardingInfoFields.fieldName, validated.fieldName))
          .limit(1);

        if (duplicate && duplicate.isActive) {
          return NextResponse.json(
            { error: "A field with this name already exists" },
            { status: 409 }
          );
        }
      }

      // Build update object with only provided fields
      const updateData: Record<string, unknown> = {
        updatedAt: sql`now()`,
      };

      if (validated.fieldName !== undefined) updateData.fieldName = validated.fieldName;
      if (validated.fieldLabel !== undefined) updateData.fieldLabel = validated.fieldLabel;
      if (validated.fieldType !== undefined) updateData.fieldType = validated.fieldType;
      if (validated.fieldOptions !== undefined) updateData.fieldOptions = validated.fieldOptions;
      if (validated.isRequired !== undefined) updateData.isRequired = validated.isRequired;
      if (validated.category !== undefined) updateData.category = validated.category;
      if (validated.displayOrder !== undefined) updateData.displayOrder = validated.displayOrder;
      if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

      const [updatedField] = await db
        .update(onboardingInfoFields)
        .set(updateData)
        .where(eq(onboardingInfoFields.id, id))
        .returning();

      return NextResponse.json(updatedField);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: (error as z.ZodError).errors },
          { status: 400 }
        );
      }
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error updating info field:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * DELETE /api/onboarding-info-fields/[id]
 * Soft delete an info field
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async () => {
    try {
      // Check if field exists
      const [existingField] = await db
        .select()
        .from(onboardingInfoFields)
        .where(eq(onboardingInfoFields.id, id))
        .limit(1);

      if (!existingField) {
        return NextResponse.json(
          { error: "Field not found" },
          { status: 404 }
        );
      }

      // Soft delete by setting isActive to false
      const [deletedField] = await db
        .update(onboardingInfoFields)
        .set({
          isActive: false,
          updatedAt: sql`now()`,
        })
        .where(eq(onboardingInfoFields.id, id))
        .returning();

      return NextResponse.json(deletedField);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error deleting info field:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}
