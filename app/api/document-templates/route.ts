import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { documentTemplates } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";
import { clearTemplateConfigCache } from "@/lib/services/template-service";
import { createTemplateSchema } from "@/lib/validation/document-schemas";

export const GET = withPermission(Permission.MANAGE_SETTINGS, async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active") === "true";

    const templates = active
      ? await db
          .select()
          .from(documentTemplates)
          .where(eq(documentTemplates.isActive, true))
          .orderBy(asc(documentTemplates.documentType))
      : await db
          .select()
          .from(documentTemplates)
          .orderBy(asc(documentTemplates.documentType));

    return NextResponse.json(templates, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching document templates:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
  try {
    const body = await req.json();
    const validated = createTemplateSchema.parse(body);

    const [existing] = await db
      .select()
      .from(documentTemplates)
      .where(eq(documentTemplates.documentType, validated.documentType))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "A template with this document type already exists", details: { documentType: validated.documentType } },
        { status: 400 }
      );
    }

    const [newTemplate] = await db
      .insert(documentTemplates)
      .values({
        documentType: validated.documentType,
        displayName: validated.displayName,
        signnowTemplateId: validated.signnowTemplateId ?? null,
        requireRecruit: validated.requireRecruit,
        requireManager: validated.requireManager,
        requireHR: validated.requireHR,
        expirationDays: validated.expirationDays,
        reminderFrequencyDays: validated.reminderFrequencyDays,
        description: validated.description ?? null,
        metadata: validated.metadata ?? {},
        isActive: validated.isActive,
      })
      .returning();

    clearTemplateConfigCache();

    if (newTemplate) {
      await logActivity({
        entityType: "document_template",
        entityId: newTemplate.id,
        action: "created",
        details: {
          documentType: newTemplate.documentType,
          displayName: newTemplate.displayName,
        },
        actorId: user.id,
      });
    }

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating document template:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
