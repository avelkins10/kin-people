import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, recruits, commissions, deals } from "@/lib/db/schema";
import { eq, and, or, notInArray, sql, gte } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";
import {
  getVisibilityFilter,
  getRecruitVisibilityFilter,
  getCommissionVisibilityFilter,
  getDealVisibilityFilter,
} from "@/lib/auth/visibility-rules";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";

const ACTIVE_RECRUIT_STATUSES = ["converted", "rejected", "dropped"];

export const GET = withAuth(async (_req, user) => {
  try {
    const canViewPeople =
      hasPermission(user, Permission.VIEW_ALL_PEOPLE) ||
      hasPermission(user, Permission.VIEW_OWN_OFFICE_PEOPLE) ||
      hasPermission(user, Permission.VIEW_OWN_TEAM);
    const showRecruitingPipeline = hasPermission(user, Permission.CREATE_RECRUITS);
    const showTeamPerformance =
      hasPermission(user, Permission.MANAGE_OWN_TEAM) ||
      hasPermission(user, Permission.MANAGE_OWN_OFFICE) ||
      hasPermission(user, Permission.MANAGE_OWN_REGION) ||
      hasPermission(user, Permission.VIEW_ALL_PEOPLE);

    let totalPeople = 0;
    let activeRecruits = 0;
    let pendingCommissions = 0;
    let recentDealsCount = 0;

    if (canViewPeople) {
      const visibilityFilter = getVisibilityFilter(user);
      if (!visibilityFilter) {
        const [row] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(people);
        totalPeople = row?.count ?? 0;
      } else if ("id" in visibilityFilter && Object.keys(visibilityFilter).length === 1) {
        totalPeople = 1;
      } else if ("officeId" in visibilityFilter && visibilityFilter.officeId) {
        const [row] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(people)
          .where(eq(people.officeId, visibilityFilter.officeId));
        totalPeople = row?.count ?? 0;
      } else if (
        "officeId" in visibilityFilter &&
        "reportsToId" in visibilityFilter &&
        visibilityFilter.officeId
      ) {
        const [row] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(people)
          .where(
            or(
              eq(people.officeId, visibilityFilter.officeId),
              eq(people.reportsToId, visibilityFilter.reportsToId!)
            )
          );
        totalPeople = row?.count ?? 0;
      }
    }

    if (showRecruitingPipeline) {
      const recruitFilter = getRecruitVisibilityFilter(user);
      const recruitConditions = [notInArray(recruits.status, ACTIVE_RECRUIT_STATUSES)];
      if (recruitFilter?.recruiterId) {
        recruitConditions.push(eq(recruits.recruiterId, recruitFilter.recruiterId));
      } else if (recruitFilter?.targetOfficeId) {
        recruitConditions.push(eq(recruits.targetOfficeId, recruitFilter.targetOfficeId));
      }
      const [recruitRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(recruits)
        .where(and(...recruitConditions));
      activeRecruits = recruitRow?.count ?? 0;
    }

    const commissionTab = showTeamPerformance ? "team" : "my-deals";
    const commissionFilter = getCommissionVisibilityFilter(user, commissionTab);
    const pendingConditions = [eq(commissions.status, "pending")];
    if (commissionFilter?.personId) {
      pendingConditions.push(eq(commissions.personId, commissionFilter.personId));
    }
    if (commissionFilter?.officeId) {
      pendingConditions.push(eq(deals.officeId, commissionFilter.officeId));
    }
    const [pendingRow] = await db
      .select({
        total: sql<string>`coalesce(sum(${commissions.amount})::text, '0')`,
      })
      .from(commissions)
      .innerJoin(deals, eq(commissions.dealId, deals.id))
      .where(and(...pendingConditions));
    pendingCommissions = parseFloat(pendingRow?.total ?? "0");

    const dealFilter = getDealVisibilityFilter(user);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
    const dealConditions = [gte(deals.closeDate, thirtyDaysAgoStr)];
    if (dealFilter?.setterId) {
      dealConditions.push(eq(deals.setterId, dealFilter.setterId));
    } else if (dealFilter?.officeId) {
      dealConditions.push(eq(deals.officeId, dealFilter.officeId));
    }
    const [dealsRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(deals)
      .where(and(...dealConditions));
    recentDealsCount = dealsRow?.count ?? 0;

    // Pipeline stage counts for Magic Patterns Overview (recruit status breakdown)
    let pipelineStageCounts: Record<string, number> = {};
    if (showRecruitingPipeline) {
      const recruitFilter = getRecruitVisibilityFilter(user);
      const pipelineConditions = [notInArray(recruits.status, ACTIVE_RECRUIT_STATUSES)];
      if (recruitFilter?.recruiterId) {
        pipelineConditions.push(eq(recruits.recruiterId, recruitFilter.recruiterId));
      } else if (recruitFilter?.targetOfficeId) {
        pipelineConditions.push(eq(recruits.targetOfficeId, recruitFilter.targetOfficeId));
      }
      const stageRows = await db
        .select({ status: recruits.status, count: sql<number>`count(*)::int` })
        .from(recruits)
        .where(and(...pipelineConditions))
        .groupBy(recruits.status);
      for (const row of stageRows) {
        const status = row.status ?? "lead";
        const key = status === "agreement_sent" || status === "agreement_signed" ? "agreement" : status;
        pipelineStageCounts[key] = (pipelineStageCounts[key] ?? 0) + (row.count ?? 0);
      }
    }

    // Onboarding count (people with status=onboarding)
    let onboardingCount = 0;
    if (canViewPeople) {
      const visibilityFilter = getVisibilityFilter(user);
      let onboardingWhere = eq(people.status, "onboarding");
      if (visibilityFilter) {
        if ("id" in visibilityFilter && Object.keys(visibilityFilter).length === 1 && visibilityFilter.id != null) {
          onboardingWhere = and(onboardingWhere, eq(people.id, visibilityFilter.id))!;
        } else if ("officeId" in visibilityFilter && visibilityFilter.officeId) {
          if ("reportsToId" in visibilityFilter && visibilityFilter.reportsToId) {
            onboardingWhere = and(
              onboardingWhere,
              or(eq(people.officeId, visibilityFilter.officeId), eq(people.reportsToId, visibilityFilter.reportsToId))
            )!;
          } else {
            onboardingWhere = and(onboardingWhere, eq(people.officeId, visibilityFilter.officeId))!;
          }
        }
      }
      const [onboardRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(people)
        .where(onboardingWhere);
      onboardingCount = onboardRow?.count ?? 0;
    }

    return NextResponse.json({
      totalPeople,
      activeRecruits,
      pendingCommissions,
      recentDealsCount,
      pipelineStageCounts,
      onboardingCount,
    });
  } catch (error: unknown) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
