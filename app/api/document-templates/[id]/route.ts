import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { documentTemplates } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";
import { clearTemplateConfigCache } from "@/lib/services/template-service";

const updateTemplateSchema = z.object({
  documentType: z.string().min(1).max(50).optional(),
  displayName: z.string().min(1).max(100).optional(),
  signnowTemplateId: z.string().max(100).optional().nullable(),
  requireRecruit: z.boolean().optional(),
  requireManager: z.boolean().optional(),
  requireHR: z.boolean().optional(),
  expirationDays: z.number().int().positive().optional(),
  reminderFrequencyDays: z.number().int().positive().optional(),
  description: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async () => {
    try {
      const [template] = await db
        .select()
        .from(documentTemplates)
        .where(eq(documentTemplates.id, id))
        .limit(1);

      if (!template) {
        return NextResponse.json(
          { error: "Document template not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(template, { status: 200 });
    } catch (error: unknown) {
      console.error("Error fetching document template:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

async function handleUpdate(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
    try {
      const body = await req.json();
      const validated = updateTemplateSchema.parse(body);

      const [existing] = await db
        .select()
        .from(documentTemplates)
        .where(eq(documentTemplates.id, id))
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { error: "Document template not found" },
          { status: 404 }
        );
      }

      if (validated.documentType !== undefined && validated.documentType !== existing.documentType) {
        const [duplicate] = await db
          .select()
          .from(documentTemplates)
          .where(
            and(
              eq(documentTemplates.documentType, validated.documentType),
              ne(documentTemplates.id, id)
            )
          )
          .limit(1);
        if (duplicate) {
          return NextResponse.json(
            { error: "A template with this document type already exists", details: { documentType: validated.documentType } },
            { status: 400 }
          );
        }
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (validated.documentType !== undefined) updateData.documentType = validated.documentType;
      if (validated.displayName !== undefined) updateData.displayName = validated.displayName;
      if (validated.signnowTemplateId !== undefined) updateData.signnowTemplateId = validated.signnowTemplateId;
      if (validated.requireRecruit !== undefined) updateData.requireRecruit = validated.requireRecruit;
      if (validated.requireManager !== undefined) updateData.requireManager = validated.requireManager;
      if (validated.requireHR !== undefined) updateData.requireHR = validated.requireHR;
      if (validated.expirationDays !== undefined) updateData.expirationDays = validated.expirationDays;
      if (validated.reminderFrequencyDays !== undefined) updateData.reminderFrequencyDays = validated.reminderFrequencyDays;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.metadata !== undefined) updateData.metadata = validated.metadata;
      if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

      const [updated] = await db
        .update(documentTemplates)
        .set(updateData as typeof documentTemplates.$inferInsert)
        .where(eq(documentTemplates.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json(
          { error: "Document template not found" },
          { status: 404 }
        );
      }

      clearTemplateConfigCache();
      if (validated.documentType !== undefined && validated.documentType !== existing.documentType) {
        clearTemplateConfigCache(existing.documentType);
        clearTemplateConfigCache(validated.documentType);
      }

      await logActivity({
        entityType: "document_template",
        entityId: id,
        action: "updated",
        details: {
          previous: { documentType: existing.documentType, displayName: existing.displayName, isActive: existing.isActive },
          new: { documentType: updated.documentType, displayName: updated.displayName, isActive: updated.isActive },
        },
        actorId: user.id,
      });

      return NextResponse.json(updated, { status: 200 });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating document template:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

export const PATCH = handleUpdate;
export const PUT = handleUpdate;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (_req, user) => {
    try {
      const [existing] = await db
        .select()
        .from(documentTemplates)
        .where(eq(documentTemplates.id, id))
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { error: "Document template not found" },
          { status: 404 }
        );
      }

      const [deactivated] = await db
        .update(documentTemplates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(documentTemplates.id, id))
        .returning();

      if (!deactivated) {
        return NextResponse.json(
          { error: "Document template not found" },
          { status: 404 }
        );
      }

      clearTemplateConfigCache();

      await logActivity({
        entityType: "document_template",
        entityId: id,
        action: "deleted",
        details: { documentType: deactivated.documentType, displayName: deactivated.displayName },
        actorId: user.id,
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: unknown) {
      console.error("Error deleting document template:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(_req);
}
