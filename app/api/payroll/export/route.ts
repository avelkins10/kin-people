import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commissions, deals, people, offices } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { getCommissionVisibilityFilter } from "@/lib/auth/visibility-rules";

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export const POST = withPermission(Permission.RUN_PAYROLL, async (req: NextRequest, user) => {
  try {
    const body = await req.json().catch(() => ({}));
    const startDate = body.startDate ?? req.nextUrl.searchParams.get("startDate");
    const endDate = body.endDate ?? req.nextUrl.searchParams.get("endDate");

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
          firstName: people.firstName,
          lastName: people.lastName,
        },
        deal: { id: deals.id },
        office: { name: offices.name },
      })
      .from(commissions)
      .innerJoin(people, eq(commissions.personId, people.id))
      .innerJoin(deals, eq(commissions.dealId, deals.id))
      .leftJoin(offices, eq(deals.officeId, offices.id))
      .where(and(...conditions));

    const headers = ["Person", "Office", "Deal", "Type", "Amount", "Status"];
    const rows = results.map((r) => [
      escapeCsv(`${r.person.firstName} ${r.person.lastName}`),
      escapeCsv(r.office?.name ?? ""),
      escapeCsv(r.deal?.id ?? ""),
      escapeCsv(r.commission.commissionType),
      escapeCsv(r.commission.amount),
      escapeCsv(r.commission.status ?? ""),
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payroll-${startDate}-to-${endDate}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error exporting payroll:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
