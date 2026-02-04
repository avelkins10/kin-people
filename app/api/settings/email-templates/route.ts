import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import {
  EMAIL_TEMPLATE_KEYS,
  DEFAULT_TEMPLATES,
  TEMPLATE_VARIABLES,
  type EmailTemplateType,
  type EmailTemplate,
} from "@/lib/email/templates";

export const GET = withAuth(async () => {
  try {
    const rows = await db.select().from(appSettings);

    const byKey: Record<string, string> = {};
    for (const row of rows) {
      if (row.key && row.value != null) byKey[row.key] = row.value;
    }

    // Parse stored templates or use defaults
    const templates: Record<EmailTemplateType, EmailTemplate> = {
      welcome: DEFAULT_TEMPLATES.welcome,
      reminder: DEFAULT_TEMPLATES.reminder,
      completion: DEFAULT_TEMPLATES.completion,
    };

    for (const [type, key] of Object.entries(EMAIL_TEMPLATE_KEYS)) {
      const stored = byKey[key];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.subject && parsed.body) {
            templates[type as EmailTemplateType] = parsed;
          }
        } catch {
          // Invalid JSON, use default
        }
      }
    }

    return NextResponse.json({
      templates,
      variables: TEMPLATE_VARIABLES,
    });
  } catch (error: unknown) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

const templateSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
});

const patchSchema = z.object({
  welcome: templateSchema.optional(),
  reminder: templateSchema.optional(),
  completion: templateSchema.optional(),
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

      if (validated.welcome) {
        await upsert(EMAIL_TEMPLATE_KEYS.welcome, JSON.stringify(validated.welcome));
      }
      if (validated.reminder) {
        await upsert(EMAIL_TEMPLATE_KEYS.reminder, JSON.stringify(validated.reminder));
      }
      if (validated.completion) {
        await upsert(EMAIL_TEMPLATE_KEYS.completion, JSON.stringify(validated.completion));
      }

      return NextResponse.json({ ok: true });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating email templates:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  }
);

// DELETE endpoint to reset a template to default
export const DELETE = withPermission(
  Permission.MANAGE_SETTINGS,
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get("type") as EmailTemplateType | null;

      if (!type || !EMAIL_TEMPLATE_KEYS[type]) {
        return NextResponse.json(
          { error: "Invalid template type" },
          { status: 400 }
        );
      }

      await db
        .delete(appSettings)
        .where(eq(appSettings.key, EMAIL_TEMPLATE_KEYS[type]));

      return NextResponse.json({ ok: true, template: DEFAULT_TEMPLATES[type] });
    } catch (error: unknown) {
      console.error("Error resetting email template:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  }
);
