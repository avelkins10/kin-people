import { NextRequest, NextResponse } from "next/server";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { canViewPerson } from "@/lib/auth/visibility-rules";
import { db } from "@/lib/db";
import { deals, commissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateCommissionsForDeal } from "@/lib/services/commission-calculator";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(Permission.CREATE_DEALS, async (_req, user) => {
    try {
      const { id } = await params;

      const [dealRow] = await db
        .select()
        .from(deals)
        .where(eq(deals.id, id))
        .limit(1);

      if (!dealRow) {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }

      const canViewSetter = await canViewPerson(user, dealRow.setterId);
      const canViewCloser = await canViewPerson(user, dealRow.closerId);
      if (!canViewSetter && !canViewCloser) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      const commissionCount = await calculateCommissionsForDeal(id);

      const updated = await db
        .select()
        .from(commissions)
        .where(eq(commissions.dealId, id));

      return NextResponse.json({
        commissionCount,
        commissions: updated,
      });
    } catch (error: unknown) {
      console.error("Error calculating commissions:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Failed to calculate commissions" },
        { status: 500 }
      );
    }
  })(_req);
}
