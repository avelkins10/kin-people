import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { personOnboardingInfo, onboardingInfoFields, people } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";

const submitInfoSchema = z.object({
  fields: z.array(z.object({
    fieldId: z.string().uuid(),
    value: z.string().nullable(),
  })),
});

/**
 * GET /api/people/[id]/onboarding-info
 * Get all collected personal info for a person
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: personId } = await params;
  return withAuth(async () => {
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

      // Get all active info fields with their submitted values for this person
      const fields = await db
        .select({
          field: onboardingInfoFields,
          info: {
            id: personOnboardingInfo.id,
            fieldValue: personOnboardingInfo.fieldValue,
            submittedAt: personOnboardingInfo.submittedAt,
            verifiedBy: personOnboardingInfo.verifiedBy,
            verifiedAt: personOnboardingInfo.verifiedAt,
          },
        })
        .from(onboardingInfoFields)
        .leftJoin(
          personOnboardingInfo,
          and(
            eq(personOnboardingInfo.fieldId, onboardingInfoFields.id),
            eq(personOnboardingInfo.personId, personId)
          )
        )
        .where(eq(onboardingInfoFields.isActive, true))
        .orderBy(onboardingInfoFields.displayOrder);

      // Transform to a more useful structure
      const result = fields.map((row) => ({
        fieldId: row.field.id,
        fieldName: row.field.fieldName,
        fieldLabel: row.field.fieldLabel,
        fieldType: row.field.fieldType,
        fieldOptions: row.field.fieldOptions,
        isRequired: row.field.isRequired,
        category: row.field.category,
        displayOrder: row.field.displayOrder,
        value: row.info?.fieldValue || null,
        submittedAt: row.info?.submittedAt || null,
        verifiedBy: row.info?.verifiedBy || null,
        verifiedAt: row.info?.verifiedAt || null,
      }));

      // Calculate completion stats
      const requiredFields = result.filter((f) => f.isRequired);
      const completedRequired = requiredFields.filter((f) => f.value !== null);
      const allFields = result;
      const completedAll = allFields.filter((f) => f.value !== null);

      return NextResponse.json({
        fields: result,
        stats: {
          totalFields: allFields.length,
          completedFields: completedAll.length,
          requiredFields: requiredFields.length,
          completedRequired: completedRequired.length,
          isComplete: completedRequired.length === requiredFields.length,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error fetching person onboarding info:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/people/[id]/onboarding-info
 * Submit personal info for a person
 * Can be used by the person themselves or by admins
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: personId } = await params;
  return withAuth(async (innerReq) => {
    try {
      const body = await innerReq.json();
      const validated = submitInfoSchema.parse(body);

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

      // Validate that all field IDs exist
      const fieldIds = validated.fields.map((f) => f.fieldId);
      const existingFields = await db
        .select({ id: onboardingInfoFields.id })
        .from(onboardingInfoFields)
        .where(eq(onboardingInfoFields.isActive, true));

      const existingFieldIds = new Set(existingFields.map((f) => f.id));
      const invalidFieldIds = fieldIds.filter((id) => !existingFieldIds.has(id));

      if (invalidFieldIds.length > 0) {
        return NextResponse.json(
          { error: "Invalid field IDs", invalidFieldIds },
          { status: 400 }
        );
      }

      // Upsert each field value
      const results = await db.transaction(async (tx) => {
        const upsertedRecords = [];

        for (const field of validated.fields) {
          // Check if record exists
          const [existing] = await tx
            .select()
            .from(personOnboardingInfo)
            .where(
              and(
                eq(personOnboardingInfo.personId, personId),
                eq(personOnboardingInfo.fieldId, field.fieldId)
              )
            )
            .limit(1);

          if (existing) {
            // Update existing record
            const [updated] = await tx
              .update(personOnboardingInfo)
              .set({
                fieldValue: field.value,
                submittedAt: sql`now()`,
                updatedAt: sql`now()`,
              })
              .where(eq(personOnboardingInfo.id, existing.id))
              .returning();
            upsertedRecords.push(updated);
          } else {
            // Insert new record
            const [inserted] = await tx
              .insert(personOnboardingInfo)
              .values({
                personId,
                fieldId: field.fieldId,
                fieldValue: field.value,
                submittedAt: sql`now()`,
              })
              .returning();
            upsertedRecords.push(inserted);
          }
        }

        return upsertedRecords;
      });

      return NextResponse.json({
        success: true,
        updatedCount: results.length,
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: (error as z.ZodError).errors },
          { status: 400 }
        );
      }
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("Error submitting person onboarding info:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}
