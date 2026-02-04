import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recruits, people, offices, roles, documents } from "@/lib/db/schema";
import { eq, and, desc, inArray, isNotNull, sql, or } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { getRecruitVisibilityFilterAsync } from "@/lib/auth/visibility-rules";
import { createRecruitHistoryRecord } from "@/lib/db/helpers/recruit-helpers";

const createRecruitSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).nullable().optional(),
  targetOfficeId: z.string().uuid().optional(),
  targetTeamId: z.string().uuid().optional(),
  targetReportsToId: z.string().uuid().optional(),
  targetRoleId: z.string().uuid().optional(),
  targetPayPlanId: z.string().uuid().optional(),
});

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const recruiterId = searchParams.get("recruiterId");
    const officeId = searchParams.get("officeId");
    const expiredDocuments = searchParams.get("expiredDocuments") === "true";

    // Subquery: count expired documents per recruit
    const expiredCountSubquery = db.$with("expired_doc_counts").as(
      db
        .select({
          recruitId: documents.recruitId,
          expiredCount: sql<number>`count(*)::int`.as("expired_count"),
        })
        .from(documents)
        .where(
          and(
            eq(documents.status, "expired"),
            isNotNull(documents.recruitId)
          )
        )
        .groupBy(documents.recruitId)
    );

    // Build base query with joins
    let query = db
      .with(expiredCountSubquery)
      .select({
        recruit: recruits,
        recruiter: {
          id: people.id,
          firstName: people.firstName,
          lastName: people.lastName,
          email: people.email,
        },
        targetOffice: {
          id: offices.id,
          name: offices.name,
        },
        targetRole: {
          id: roles.id,
          name: roles.name,
        },
        expiredDocumentsCount: sql<number>`coalesce(${expiredCountSubquery.expiredCount}, 0)`.as(
          "expiredDocumentsCount"
        ),
      })
      .from(recruits)
      .leftJoin(people, eq(recruits.recruiterId, people.id))
      .leftJoin(offices, eq(recruits.targetOfficeId, offices.id))
      .leftJoin(roles, eq(recruits.targetRoleId, roles.id))
      .leftJoin(
        expiredCountSubquery,
        eq(recruits.id, expiredCountSubquery.recruitId)
      );

    // Build all filter conditions together
    const conditions: any[] = [];

    // Apply visibility filters first (using async hierarchy-based filter)
    const visibilityFilter = await getRecruitVisibilityFilterAsync(user);
    if (visibilityFilter) {
      if (visibilityFilter.recruiterId) {
        // Sales Rep: only their own recruits
        conditions.push(eq(recruits.recruiterId, visibilityFilter.recruiterId));
      } else if (visibilityFilter.targetOfficeIds && visibilityFilter.targetOfficeIds.length > 0) {
        // Regional Manager: recruits targeting any office in their region OR their own recruits
        conditions.push(
          or(
            inArray(recruits.targetOfficeId, visibilityFilter.targetOfficeIds),
            eq(recruits.recruiterId, user.id)
          )
        );
      } else if (visibilityFilter.targetOfficeId) {
        // Area Director/Team Lead: recruits targeting their office OR their own recruits
        conditions.push(
          or(
            eq(recruits.targetOfficeId, visibilityFilter.targetOfficeId),
            eq(recruits.recruiterId, user.id)
          )
        );
      }
    }

    // Apply additional user-supplied filters
    if (status) {
      conditions.push(eq(recruits.status, status));
    }
    if (recruiterId) {
      conditions.push(eq(recruits.recruiterId, recruiterId));
    }
    if (officeId) {
      conditions.push(eq(recruits.targetOfficeId, officeId));
    }
    if (expiredDocuments) {
      conditions.push(
        inArray(
          recruits.id,
          db
            .select({ recruitId: documents.recruitId })
            .from(documents)
            .where(
              and(
                eq(documents.status, "expired"),
                isNotNull(documents.recruitId)
              )
            )
        )
      );
    }

    // Apply all conditions together in a single where clause
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Order by created date
    query = query.orderBy(desc(recruits.createdAt)) as any;

    const results = await query;

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error fetching recruits:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withPermission(Permission.CREATE_RECRUITS, async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const validated = createRecruitSchema.parse(body);

    // Create recruit record
    const [newRecruit] = await db
      .insert(recruits)
      .values({
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email || null,
        phone: validated.phone || null,
        source: validated.source || null,
        priority: validated.priority ?? null,
        recruiterId: user.id,
        status: "lead",
        targetOfficeId: validated.targetOfficeId || null,
        targetTeamId: validated.targetTeamId || null,
        targetReportsToId: validated.targetReportsToId || null,
        targetRoleId: validated.targetRoleId || null,
        targetPayPlanId: validated.targetPayPlanId || null,
      })
      .returning();

    // Create recruit history record
    await createRecruitHistoryRecord({
      recruitId: newRecruit.id,
      previousStatus: null,
      newStatus: "lead",
      notes: "Recruit created",
      changedById: user.id,
    });

    // Fetch recruit with details
    const recruitWithDetails = await db
      .select({
        recruit: recruits,
        recruiter: {
          id: people.id,
          firstName: people.firstName,
          lastName: people.lastName,
          email: people.email,
        },
        targetOffice: {
          id: offices.id,
          name: offices.name,
        },
        targetRole: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(recruits)
      .leftJoin(people, eq(recruits.recruiterId, people.id))
      .leftJoin(offices, eq(recruits.targetOfficeId, offices.id))
      .leftJoin(roles, eq(recruits.targetRoleId, roles.id))
      .where(eq(recruits.id, newRecruit.id))
      .limit(1);

    return NextResponse.json(recruitWithDetails[0], { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating recruit:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});
