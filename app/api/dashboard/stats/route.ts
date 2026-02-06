import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, recruits, commissions, deals } from "@/lib/db/schema";
import { eq, and, or, notInArray, sql, gte, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";
import {
  getVisibilityFilterAsync,
  getRecruitVisibilityFilterAsync,
  getCommissionVisibilityFilterAsync,
  getDealVisibilityFilterAsync,
} from "@/lib/auth/visibility-rules";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";

const ACTIVE_RECRUIT_STATUSES = ["converted", "rejected", "dropped"];

/** Build a Drizzle WHERE condition from async visibility filter for people queries */
function buildPeopleVisibilityCondition(
  visibility: Awaited<ReturnType<typeof getVisibilityFilterAsync>>
) {
  if (!visibility) return undefined; // no filter = admin
  switch (visibility.type) {
    case "offices":
    case "office":
      if (visibility.officeIds && visibility.officeIds.length > 0) {
        return inArray(people.officeId, visibility.officeIds);
      }
      return eq(people.id, "00000000-0000-0000-0000-000000000000"); // no offices = no results
    case "team":
      if (visibility.personIds && visibility.personIds.length > 0) {
        return inArray(people.id, visibility.personIds);
      }
      return eq(people.id, "00000000-0000-0000-0000-000000000000");
    case "self":
      if (visibility.personIds && visibility.personIds.length > 0) {
        return inArray(people.id, visibility.personIds);
      }
      return eq(people.id, "00000000-0000-0000-0000-000000000000");
    default:
      return undefined;
  }
}

export const GET = withAuth(async (_req, user) => {
  try {
    const showTeamPerformance =
      hasPermission(user, Permission.MANAGE_OWN_TEAM) ||
      hasPermission(user, Permission.MANAGE_OWN_OFFICE) ||
      hasPermission(user, Permission.MANAGE_OWN_REGION) ||
      hasPermission(user, Permission.VIEW_ALL_PEOPLE);
    const showRecruitingPipeline = hasPermission(user, Permission.CREATE_RECRUITS);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    // ─── Personal stats (always scoped to user.id) ───
    const [personalPeopleRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(people)
      .where(eq(people.recruitedById, user.id));
    const personalTotalPeople = personalPeopleRow?.count ?? 0;

    const personalRecruitConditions = [
      notInArray(recruits.status, ACTIVE_RECRUIT_STATUSES),
      eq(recruits.recruiterId, user.id),
    ];
    const [personalRecruitRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(recruits)
      .where(and(...personalRecruitConditions));
    const personalActiveRecruits = personalRecruitRow?.count ?? 0;

    const [personalCommRow] = await db
      .select({
        total: sql<string>`coalesce(sum(${commissions.amount})::text, '0')`,
      })
      .from(commissions)
      .innerJoin(deals, eq(commissions.dealId, deals.id))
      .where(and(eq(commissions.status, "pending"), eq(commissions.personId, user.id)));
    const personalPendingCommissions = parseFloat(personalCommRow?.total ?? "0");

    const [personalDealsRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(deals)
      .where(
        and(
          gte(deals.closeDate, thirtyDaysAgoStr),
          or(eq(deals.setterId, user.id), eq(deals.closerId, user.id))
        )
      );
    const personalRecentDeals = personalDealsRow?.count ?? 0;

    const [personalOnboardRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(people)
      .where(and(eq(people.status, "onboarding"), eq(people.recruitedById, user.id)));
    const personalOnboardingCount = personalOnboardRow?.count ?? 0;

    // Personal pipeline stage counts
    const personalPipelineStageCounts: Record<string, number> = {};
    const personalStageRows = await db
      .select({ status: recruits.status, count: sql<number>`count(*)::int` })
      .from(recruits)
      .where(and(notInArray(recruits.status, ACTIVE_RECRUIT_STATUSES), eq(recruits.recruiterId, user.id)))
      .groupBy(recruits.status);
    for (const row of personalStageRows) {
      const status = row.status ?? "lead";
      const key = status === "agreement_sent" || status === "agreement_signed" ? "agreement" : status;
      personalPipelineStageCounts[key] = (personalPipelineStageCounts[key] ?? 0) + (row.count ?? 0);
    }

    const personal = {
      totalPeople: personalTotalPeople,
      activeRecruits: personalActiveRecruits,
      pendingCommissions: personalPendingCommissions,
      recentDealsCount: personalRecentDeals,
      onboardingCount: personalOnboardingCount,
      pipelineStageCounts: personalPipelineStageCounts,
    };

    // ─── Team stats (scoped by role visibility, null for self-only users) ───
    let team: typeof personal | null = null;

    if (showTeamPerformance) {
      const visibility = await getVisibilityFilterAsync(user);
      const visCondition = buildPeopleVisibilityCondition(visibility);

      // Total people in scope
      const peopleConditions = visCondition ? [visCondition] : [];
      const [teamPeopleRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(people)
        .where(peopleConditions.length > 0 ? and(...peopleConditions) : undefined);
      const teamTotalPeople = teamPeopleRow?.count ?? 0;

      // Active recruits in scope
      const recruitVisibility = await getRecruitVisibilityFilterAsync(user);
      const recruitConditions = [notInArray(recruits.status, ACTIVE_RECRUIT_STATUSES)];
      if (recruitVisibility?.recruiterId) {
        recruitConditions.push(eq(recruits.recruiterId, recruitVisibility.recruiterId));
      } else if (recruitVisibility?.targetOfficeIds && recruitVisibility.targetOfficeIds.length > 0) {
        recruitConditions.push(inArray(recruits.targetOfficeId, recruitVisibility.targetOfficeIds) as any);
      } else if (recruitVisibility?.targetOfficeId) {
        recruitConditions.push(eq(recruits.targetOfficeId, recruitVisibility.targetOfficeId));
      }
      const [teamRecruitRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(recruits)
        .where(and(...recruitConditions));
      const teamActiveRecruits = teamRecruitRow?.count ?? 0;

      // Pending commissions in scope
      const commissionVisibility = await getCommissionVisibilityFilterAsync(user, "team");
      const pendingConditions = [eq(commissions.status, "pending")];
      if (commissionVisibility?.personId) {
        pendingConditions.push(eq(commissions.personId, commissionVisibility.personId));
      } else if (commissionVisibility?.officeIds && commissionVisibility.officeIds.length > 0) {
        pendingConditions.push(inArray(deals.officeId, commissionVisibility.officeIds) as any);
      } else if (commissionVisibility?.personIds && commissionVisibility.personIds.length > 0) {
        pendingConditions.push(inArray(commissions.personId, commissionVisibility.personIds) as any);
      }
      const [teamCommRow] = await db
        .select({
          total: sql<string>`coalesce(sum(${commissions.amount})::text, '0')`,
        })
        .from(commissions)
        .innerJoin(deals, eq(commissions.dealId, deals.id))
        .where(and(...pendingConditions));
      const teamPendingCommissions = parseFloat(teamCommRow?.total ?? "0");

      // Recent deals in scope
      const dealVisibility = await getDealVisibilityFilterAsync(user);
      const dealConditions = [gte(deals.closeDate, thirtyDaysAgoStr)];
      if (dealVisibility?.setterId) {
        dealConditions.push(eq(deals.setterId, dealVisibility.setterId));
      } else if (dealVisibility?.officeIds && dealVisibility.officeIds.length > 0) {
        dealConditions.push(inArray(deals.officeId, dealVisibility.officeIds) as any);
      } else if (dealVisibility?.officeId) {
        dealConditions.push(eq(deals.officeId, dealVisibility.officeId));
      }
      const [teamDealsRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(deals)
        .where(and(...dealConditions));
      const teamRecentDeals = teamDealsRow?.count ?? 0;

      // Onboarding count in scope
      const onboardingConditions = [eq(people.status, "onboarding")];
      if (visCondition) {
        onboardingConditions.push(visCondition as any);
      }
      const [teamOnboardRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(people)
        .where(and(...onboardingConditions));
      const teamOnboardingCount = teamOnboardRow?.count ?? 0;

      // Pipeline stage counts in scope
      const teamPipelineStageCounts: Record<string, number> = {};
      if (showRecruitingPipeline) {
        const pipelineConditions = [notInArray(recruits.status, ACTIVE_RECRUIT_STATUSES)];
        if (recruitVisibility?.recruiterId) {
          pipelineConditions.push(eq(recruits.recruiterId, recruitVisibility.recruiterId));
        } else if (recruitVisibility?.targetOfficeIds && recruitVisibility.targetOfficeIds.length > 0) {
          pipelineConditions.push(inArray(recruits.targetOfficeId, recruitVisibility.targetOfficeIds) as any);
        } else if (recruitVisibility?.targetOfficeId) {
          pipelineConditions.push(eq(recruits.targetOfficeId, recruitVisibility.targetOfficeId));
        }
        const stageRows = await db
          .select({ status: recruits.status, count: sql<number>`count(*)::int` })
          .from(recruits)
          .where(and(...pipelineConditions))
          .groupBy(recruits.status);
        for (const row of stageRows) {
          const status = row.status ?? "lead";
          const key = status === "agreement_sent" || status === "agreement_signed" ? "agreement" : status;
          teamPipelineStageCounts[key] = (teamPipelineStageCounts[key] ?? 0) + (row.count ?? 0);
        }
      }

      team = {
        totalPeople: teamTotalPeople,
        activeRecruits: teamActiveRecruits,
        pendingCommissions: teamPendingCommissions,
        recentDealsCount: teamRecentDeals,
        onboardingCount: teamOnboardingCount,
        pipelineStageCounts: teamPipelineStageCounts,
      };
    }

    return NextResponse.json({ personal, team });
  } catch (error: unknown) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
