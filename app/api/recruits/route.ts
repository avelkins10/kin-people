import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recruits, people, offices, roles, teams, payPlans } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { getRecruitVisibilityFilter } from "@/lib/auth/visibility-rules";
import { createRecruitHistoryRecord } from "@/lib/db/helpers/recruit-helpers";

const createRecruitSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
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

    // Build base query with joins
    let query = db
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
      .leftJoin(roles, eq(recruits.targetRoleId, roles.id));

    // Build all filter conditions together
    const conditions: any[] = [];
    
    // Apply visibility filters first
    const visibilityFilter = getRecruitVisibilityFilter(user);
    if (visibilityFilter) {
      if (visibilityFilter.recruiterId) {
        conditions.push(eq(recruits.recruiterId, visibilityFilter.recruiterId));
      } else if (visibilityFilter.targetOfficeId) {
        conditions.push(eq(recruits.targetOfficeId, visibilityFilter.targetOfficeId));
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
