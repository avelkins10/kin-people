import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { officeLeadership, people } from "@/lib/db/schema";
import { eq, and, or, isNull, lte, gte, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";

/**
 * GET /api/regions/[id]/leadership
 * Returns current Regional Manager for the given region.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    try {
      const { id } = await params;
      const today = new Date().toISOString().slice(0, 10);

      const rows = await db
        .select({
          id: officeLeadership.id,
          officeId: officeLeadership.officeId,
          region: officeLeadership.region,
          regionId: officeLeadership.regionId,
          division: officeLeadership.division,
          roleType: officeLeadership.roleType,
          personId: officeLeadership.personId,
          personName: sql<string>`concat(${people.firstName}, ' ', ${people.lastName})`,
          effectiveFrom: officeLeadership.effectiveFrom,
          effectiveTo: officeLeadership.effectiveTo,
          createdAt: officeLeadership.createdAt,
          updatedAt: officeLeadership.updatedAt,
        })
        .from(officeLeadership)
        .leftJoin(people, eq(officeLeadership.personId, people.id))
        .where(
          and(
            eq(officeLeadership.regionId, id),
            eq(officeLeadership.roleType, "regional"),
            lte(officeLeadership.effectiveFrom, today),
            or(
              isNull(officeLeadership.effectiveTo),
              gte(officeLeadership.effectiveTo, today)
            )
          )
        );

      return NextResponse.json(rows);
    } catch (error: unknown) {
      console.error("Error fetching region leadership:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
