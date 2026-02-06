import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { officeLeadership, people } from "@/lib/db/schema";
import { eq, and, isNull, lte, or, gte, sql } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

/**
 * GET /api/office-leadership
 * Fetch leadership assignments. Supports filtering:
 *   ?officeId=...   — current AD for an office
 *   ?regionId=...   — current Regional for a region
 *   ?current=true   — only return records where effectiveTo is null or in the future
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const officeId = searchParams.get("officeId");
    const regionId = searchParams.get("regionId");
    const currentOnly = searchParams.get("current") === "true";

    const today = new Date().toISOString().slice(0, 10);

    const conditions = [];
    if (officeId) conditions.push(eq(officeLeadership.officeId, officeId));
    if (regionId) conditions.push(eq(officeLeadership.regionId, regionId));
    if (currentOnly) {
      conditions.push(lte(officeLeadership.effectiveFrom, today));
      conditions.push(
        or(isNull(officeLeadership.effectiveTo), gte(officeLeadership.effectiveTo, today))!
      );
    }

    const rows = await db
      .select({
        id: officeLeadership.id,
        officeId: officeLeadership.officeId,
        region: officeLeadership.region,
        regionId: officeLeadership.regionId,
        division: officeLeadership.division,
        roleType: officeLeadership.roleType,
        personId: officeLeadership.personId,
        personName: sql<string>`concat(${people.firstName}, ' ', ${people.lastName})`,
        effectiveFrom: officeLeadership.effectiveFrom,
        effectiveTo: officeLeadership.effectiveTo,
        createdAt: officeLeadership.createdAt,
        updatedAt: officeLeadership.updatedAt,
      })
      .from(officeLeadership)
      .leftJoin(people, eq(officeLeadership.personId, people.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json(rows);
  } catch (error: unknown) {
    console.error("Error fetching office leadership:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

const roleTypeEnum = z.enum(["ad", "regional", "divisional", "vp"]);

const createLeadershipSchema = z
  .object({
    officeId: z.string().uuid().optional(),
    region: z.string().max(100).optional(),
    regionId: z.string().uuid().optional(),
    division: z.string().max(100).optional(),
    roleType: roleTypeEnum,
    personId: z.string().uuid(),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.roleType === "ad") return !!data.officeId && !data.region && !data.regionId && !data.division;
      if (data.roleType === "regional") return (!!data.region || !!data.regionId) && !data.officeId && !data.division;
      if (data.roleType === "divisional") return !!data.division && !data.officeId && !data.region && !data.regionId;
      if (data.roleType === "vp") return !data.officeId && !data.region && !data.regionId; // division optional (null = company-wide)
      return false;
    },
    { message: "AD requires officeId; Regional requires region or regionId; Divisional requires division; VP allows division or null (company-wide)." }
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
            eq(officeLeadership.roleType, "ad"),
            or(isNull(officeLeadership.effectiveTo), gte(officeLeadership.effectiveTo, new Date().toISOString().slice(0, 10)))
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
    if (validated.roleType === "regional" && (validated.region || validated.regionId)) {
      const regionCondition = validated.regionId
        ? eq(officeLeadership.regionId, validated.regionId)
        : eq(officeLeadership.region, validated.region!);
      const existing = await db
        .select()
        .from(officeLeadership)
        .where(
          and(
            regionCondition,
            eq(officeLeadership.roleType, "regional"),
            or(isNull(officeLeadership.effectiveTo), gte(officeLeadership.effectiveTo, new Date().toISOString().slice(0, 10)))
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
        region: validated.roleType === "regional" ? validated.region ?? null : null,
        regionId: validated.roleType === "regional" ? validated.regionId ?? null : null,
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
