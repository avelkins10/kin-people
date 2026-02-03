import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { officeLeadership, offices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";

/**
 * GET /api/people/[id]/leadership
 * List office leadership assignments for this person (AD/Regional/Divisional/VP).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    try {
      const { id: personId } = await params;

      const rows = await db
        .select({
          id: officeLeadership.id,
          roleType: officeLeadership.roleType,
          officeId: officeLeadership.officeId,
          region: officeLeadership.region,
          division: officeLeadership.division,
          effectiveFrom: officeLeadership.effectiveFrom,
          effectiveTo: officeLeadership.effectiveTo,
          officeName: offices.name,
        })
        .from(officeLeadership)
        .leftJoin(offices, eq(officeLeadership.officeId, offices.id))
        .where(eq(officeLeadership.personId, personId));

      const leadership = rows.map((r) => ({
        id: r.id,
        roleType: r.roleType,
        officeId: r.officeId,
        officeName: r.officeName,
        region: r.region,
        division: r.division,
        effectiveFrom: r.effectiveFrom,
        effectiveTo: r.effectiveTo,
      }));

      return NextResponse.json({ leadership });
    } catch (error: unknown) {
      console.error("Error fetching person leadership:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
