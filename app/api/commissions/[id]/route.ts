import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commissions, deals, people, offices, orgSnapshots, payPlans, commissionRules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";
import { canViewCommission, getCommissionsForDeal } from "@/lib/auth/visibility-rules";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (req: NextRequest, user) => {
    try {
      const commissionId = id;

    // Fetch commission with deal
    const [commissionData] = await db
      .select({
        commission: commissions,
        deal: deals,
      })
      .from(commissions)
      .innerJoin(deals, eq(commissions.dealId, deals.id))
      .where(eq(commissions.id, commissionId))
      .limit(1);

    if (!commissionData) {
      return NextResponse.json(
        { error: "Commission not found" },
        { status: 404 }
      );
    }

    const { commission, deal } = commissionData;

    // Check visibility
    const canView = await canViewCommission(user, {
      personId: commission.personId,
      reportsToId: null,
      dealId: deal.id,
      commissionType: commission.commissionType,
    });

    if (!canView) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Fetch person (commission recipient)
    const [personData] = await db
      .select()
      .from(people)
      .where(eq(people.id, commission.personId))
      .limit(1);

    // Fetch setter
    const [setterData] = await db
      .select()
      .from(people)
      .where(eq(people.id, deal.setterId))
      .limit(1);

    // Fetch closer
    const [closerData] = await db
      .select()
      .from(people)
      .where(eq(people.id, deal.closerId))
      .limit(1);

    // Fetch office
    const [officeData] = await db
      .select()
      .from(offices)
      .where(eq(offices.id, deal.officeId || ""))
      .limit(1);

    // Fetch org snapshot if available
    let orgSnapshot = null;
    if (commission.calcDetails?.org_snapshot_id) {
      const [snapshotData] = await db
        .select()
        .from(orgSnapshots)
        .where(eq(orgSnapshots.id, commission.calcDetails.org_snapshot_id))
        .limit(1);
      orgSnapshot = snapshotData || null;
    }

    // Fetch pay plan if available
    let payPlan = null;
    if (commission.payPlanId) {
      const [payPlanData] = await db
        .select()
        .from(payPlans)
        .where(eq(payPlans.id, commission.payPlanId))
        .limit(1);
      payPlan = payPlanData || null;
    }

    // Fetch commission rule if available
    let commissionRule = null;
    if (commission.commissionRuleId) {
      const [ruleData] = await db
        .select()
        .from(commissionRules)
        .where(eq(commissionRules.id, commission.commissionRuleId))
        .limit(1);
      commissionRule = ruleData || null;
    }

    // Get all commissions for this deal (filtered by visibility)
    const allDealCommissions = await getCommissionsForDeal(deal.id, user.id);

    return NextResponse.json({
      commission,
      deal,
      person: personData || null,
      setter: setterData || null,
      closer: closerData || null,
      office: officeData || null,
      orgSnapshot,
      payPlan,
      commissionRule,
      allDealCommissions, // All commissions user can see for this deal
    });
  } catch (error: any) {
    console.error("Error fetching commission:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
  })(req);
}
