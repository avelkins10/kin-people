import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commissions, deals } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { getCommissionVisibilityFilter } from "@/lib/auth/visibility-rules";

export const GET = withPermission(Permission.RUN_PAYROLL, async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const baseConditions = [
      gte(commissions.createdAt, new Date(startDate)),
      lte(commissions.createdAt, new Date(endDate)),
    ];

    const visibilityFilter = getCommissionVisibilityFilter(user, "team");
    if (visibilityFilter?.personId) {
      baseConditions.push(eq(commissions.personId, visibilityFilter.personId));
    }
    if (visibilityFilter?.officeId) {
      baseConditions.push(eq(deals.officeId, visibilityFilter.officeId));
    }

    const whereClause = and(...baseConditions);

    const [totalRow] = await db
      .select({
        total: sql<string>`coalesce(sum(${commissions.amount})::text, '0')`,
        count: sql<number>`count(*)::int`,
      })
      .from(commissions)
      .innerJoin(deals, eq(commissions.dealId, deals.id))
      .where(whereClause);

    const [peopleCountRow] = await db
      .select({
        count: sql<number>`count(distinct ${commissions.personId})::int`,
      })
      .from(commissions)
      .innerJoin(deals, eq(commissions.dealId, deals.id))
      .where(whereClause);

    const [pendingRow] = await db
      .select({
        total: sql<string>`coalesce(sum(${commissions.amount})::text, '0')`,
      })
      .from(commissions)
      .innerJoin(deals, eq(commissions.dealId, deals.id))
      .where(and(...baseConditions, eq(commissions.status, "pending")));

    return NextResponse.json({
      totalCommissions: parseFloat(totalRow?.total ?? "0"),
      totalPeople: peopleCountRow?.count ?? 0,
      pendingAmount: parseFloat(pendingRow?.total ?? "0"),
    });
  } catch (error: unknown) {
    console.error("Error fetching payroll summary:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
