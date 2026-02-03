import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recruits } from "@/lib/db/schema";
import { eq, and, notInArray, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";
import { getRecruitVisibilityFilter } from "@/lib/auth/visibility-rules";

const TERMINAL_STATUSES = ["converted", "rejected", "dropped"];
const PIPELINE_STATUSES = [
  "lead",
  "contacted",
  "interviewing",
  "offer_sent",
  "agreement_sent",
  "agreement_signed",
  "onboarding",
] as const;
const STUCK_THRESHOLD_DAYS = 5;
const OFFER_ATTENTION_DAYS = 7;

export const GET = withAuth(async (_req, user) => {
  try {
    const visibilityFilter = getRecruitVisibilityFilter(user);
    const conditions: ReturnType<typeof eq>[] = [
      notInArray(recruits.status, TERMINAL_STATUSES),
    ];
    if (visibilityFilter?.recruiterId) {
      conditions.push(eq(recruits.recruiterId, visibilityFilter.recruiterId));
    } else if (visibilityFilter?.targetOfficeId) {
      conditions.push(eq(recruits.targetOfficeId, visibilityFilter.targetOfficeId));
    }
    const whereClause = and(...conditions);

    // In pipeline count (active recruits)
    const [inPipelineRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(recruits)
      .where(whereClause);
    const inPipeline = inPipelineRow?.count ?? 0;

    // Count by status for pipeline columns
    const byStatusResult = await db
      .select({
        status: recruits.status,
        count: sql<number>`count(*)::int`,
      })
      .from(recruits)
      .where(whereClause)
      .groupBy(recruits.status);

    const byStatus: Record<string, number> = {};
    for (const s of PIPELINE_STATUSES) {
      byStatus[s] = 0;
    }
    for (const row of byStatusResult) {
      if (row.status) byStatus[row.status] = row.count;
    }

    // Open positions = distinct target roles with at least one active recruit
    const [openPositionsRow] = await db
      .select({
        count: sql<number>`count(distinct ${recruits.targetRoleId})::int`,
      })
      .from(recruits)
      .where(and(whereClause, sql`${recruits.targetRoleId} is not null`));
    const openPositions = openPositionsRow?.count ?? 0;

    // Interviewing this week (optional: count status=interviewing, or those updated this week)
    const interviewingCount = byStatus["interviewing"] ?? 0;

    // Starting soon = agreement_signed + onboarding
    const startingSoonCount = (byStatus["agreement_signed"] ?? 0) + (byStatus["onboarding"] ?? 0);

    // Action items: stuck >5 days in same status, or offer/agreement sent >7 days
    const stuckCutoff = new Date();
    stuckCutoff.setDate(stuckCutoff.getDate() - STUCK_THRESHOLD_DAYS);
    const offerCutoff = new Date();
    offerCutoff.setDate(offerCutoff.getDate() - OFFER_ATTENTION_DAYS);

    const allRecruitsForActions = await db
      .select({
        id: recruits.id,
        status: recruits.status,
        updatedAt: recruits.updatedAt,
        agreementSentAt: recruits.agreementSentAt,
      })
      .from(recruits)
      .where(whereClause);

    const actionItems: { recruitId: string; reason: "stuck" | "offer_attention"; message: string }[] = [];
    const stuckStatuses = ["lead", "contacted", "interviewing"];
    const offerStatuses = ["offer_sent", "agreement_sent"];

    for (const r of allRecruitsForActions) {
      const updatedAt = r.updatedAt ? new Date(r.updatedAt) : null;
      const agreementSentAt = r.agreementSentAt ? new Date(r.agreementSentAt) : null;

      if (stuckStatuses.includes(r.status ?? "") && updatedAt && updatedAt < stuckCutoff) {
        const days = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
        actionItems.push({
          recruitId: r.id,
          reason: "stuck",
          message: `In ${r.status} for ${days} days`,
        });
      } else if (offerStatuses.includes(r.status ?? "")) {
        const refDate = agreementSentAt ?? updatedAt;
        if (refDate && refDate < offerCutoff) {
          const days = Math.floor((Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24));
          actionItems.push({
            recruitId: r.id,
            reason: "offer_attention",
            message: `Offer/agreement out ${days} days`,
          });
        }
      }
    }

    return NextResponse.json({
      inPipeline,
      byStatus,
      openPositions,
      interviewingCount,
      startingSoonCount,
      actionItems,
      actionItemsCount: actionItems.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching recruiting stats:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
