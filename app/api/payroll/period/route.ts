import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commissions, deals, people, offices } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
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

    const conditions = [
      gte(commissions.createdAt, new Date(startDate)),
      lte(commissions.createdAt, new Date(endDate)),
    ];

    const visibilityFilter = getCommissionVisibilityFilter(user, "team");
    if (visibilityFilter?.personId) {
      conditions.push(eq(commissions.personId, visibilityFilter.personId));
    }
    if (visibilityFilter?.officeId) {
      conditions.push(eq(deals.officeId, visibilityFilter.officeId));
    }

    const results = await db
      .select({
        commission: commissions,
        person: {
          id: people.id,
          firstName: people.firstName,
          lastName: people.lastName,
        },
        deal: {
          id: deals.id,
          closeDate: deals.closeDate,
        },
        office: {
          id: offices.id,
          name: offices.name,
        },
      })
      .from(commissions)
      .innerJoin(people, eq(commissions.personId, people.id))
      .innerJoin(deals, eq(commissions.dealId, deals.id))
      .leftJoin(offices, eq(deals.officeId, offices.id))
      .where(and(...conditions));

    const list = results.map((r) => ({
      ...r.commission,
      person: r.person,
      deal: r.deal,
      office: r.office,
    }));

    return NextResponse.json(list);
  } catch (error: unknown) {
    console.error("Error fetching payroll period:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
