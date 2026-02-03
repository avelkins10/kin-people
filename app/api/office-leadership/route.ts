import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { officeLeadership } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

const roleTypeEnum = z.enum(["ad", "regional", "divisional", "vp"]);

const createLeadershipSchema = z
  .object({
    officeId: z.string().uuid().optional(),
    region: z.string().max(100).optional(),
    division: z.string().max(100).optional(),
    roleType: roleTypeEnum,
    personId: z.string().uuid(),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.roleType === "ad") return !!data.officeId && !data.region && !data.division;
      if (data.roleType === "regional") return !!data.region && !data.officeId && !data.division;
      if (data.roleType === "divisional") return !!data.division && !data.officeId && !data.region;
      if (data.roleType === "vp") return !data.officeId && !data.region; // division optional (null = company-wide)
      return false;
    },
    { message: "AD requires officeId; Regional requires region; Divisional requires division; VP allows division or null (company-wide)." }
  );

/**
 * POST /api/office-leadership
 * Create a leadership assignment. Uniqueness (one AD per office, one Regional per region, etc.) is enforced here.
 */
export const POST = withPermission(Permission.MANAGE_ALL_OFFICES, async (req, user) => {
  try {
    const body = await req.json();
    const validated = createLeadershipSchema.parse(body);

    // Enforce one AD per office, one Regional per region, one Divisional per division
    if (validated.roleType === "ad" && validated.officeId) {
      const existing = await db
        .select()
        .from(officeLeadership)
        .where(
          and(
            eq(officeLeadership.officeId, validated.officeId),
            eq(officeLeadership.roleType, "ad")
          )
        )
        .limit(1);
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "This office already has an AD assigned." },
          { status: 409 }
        );
      }
    }
    if (validated.roleType === "regional" && validated.region) {
      const existing = await db
        .select()
        .from(officeLeadership)
        .where(
          and(
            eq(officeLeadership.region, validated.region),
            eq(officeLeadership.roleType, "regional")
          )
        )
        .limit(1);
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "This region already has a Regional assigned." },
          { status: 409 }
        );
      }
    }
    if (validated.roleType === "divisional" && validated.division) {
      const existing = await db
        .select()
        .from(officeLeadership)
        .where(
          and(
            eq(officeLeadership.division, validated.division),
            eq(officeLeadership.roleType, "divisional")
          )
        )
        .limit(1);
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "This division already has a Divisional assigned." },
          { status: 409 }
        );
      }
    }

    const [inserted] = await db
      .insert(officeLeadership)
      .values({
        officeId: validated.roleType === "ad" ? validated.officeId : null,
        region: validated.roleType === "regional" ? validated.region : null,
        division: validated.roleType === "divisional" ? validated.division : validated.roleType === "vp" ? validated.division ?? null : null,
        roleType: validated.roleType,
        personId: validated.personId,
        effectiveFrom: validated.effectiveFrom,
        effectiveTo: validated.effectiveTo ?? null,
      })
      .returning();

    if (inserted) {
      await logActivity({
        entityType: "office",
        entityId: inserted.officeId ?? inserted.region ?? inserted.division ?? inserted.id,
        action: "created",
        details: {
          leadershipId: inserted.id,
          roleType: inserted.roleType,
          personId: inserted.personId,
          effectiveFrom: inserted.effectiveFrom,
          effectiveTo: inserted.effectiveTo,
        },
        actorId: user.id,
      });
    }

    return NextResponse.json(inserted, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating office leadership:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
