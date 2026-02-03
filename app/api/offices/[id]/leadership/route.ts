import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offices, officeLeadership, people } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

/**
 * GET /api/offices/[id]/leadership
 * List leadership assignments for an office: AD for this office, plus Regional/Divisional/VP for this office's region/division.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(Permission.MANAGE_ALL_OFFICES, async () => {
    try {
      const { id: officeId } = await params;

      const [office] = await db
        .select()
        .from(offices)
        .where(eq(offices.id, officeId))
        .limit(1);

      if (!office) {
        return NextResponse.json({ error: "Office not found" }, { status: 404 });
      }

      // AD for this office
      const adRows = await db
        .select({
          id: officeLeadership.id,
          officeId: officeLeadership.officeId,
          region: officeLeadership.region,
          division: officeLeadership.division,
          roleType: officeLeadership.roleType,
          personId: officeLeadership.personId,
          effectiveFrom: officeLeadership.effectiveFrom,
          effectiveTo: officeLeadership.effectiveTo,
          personFirstName: people.firstName,
          personLastName: people.lastName,
        })
        .from(officeLeadership)
        .innerJoin(people, eq(officeLeadership.personId, people.id))
        .where(eq(officeLeadership.officeId, officeId));

      // Regional for this office's region (if set)
      const regionalRows =
        office.region != null
          ? await db
              .select({
                id: officeLeadership.id,
                officeId: officeLeadership.officeId,
                region: officeLeadership.region,
                division: officeLeadership.division,
                roleType: officeLeadership.roleType,
                personId: officeLeadership.personId,
                effectiveFrom: officeLeadership.effectiveFrom,
                effectiveTo: officeLeadership.effectiveTo,
                personFirstName: people.firstName,
                personLastName: people.lastName,
              })
              .from(officeLeadership)
              .innerJoin(people, eq(officeLeadership.personId, people.id))
              .where(
                and(
                  eq(officeLeadership.region, office.region),
                  eq(officeLeadership.roleType, "regional")
                )
              )
          : [];

      // Divisional for this office's division (if set)
      const divisionalRows =
        office.division != null
          ? await db
              .select({
                id: officeLeadership.id,
                officeId: officeLeadership.officeId,
                region: officeLeadership.region,
                division: officeLeadership.division,
                roleType: officeLeadership.roleType,
                personId: officeLeadership.personId,
                effectiveFrom: officeLeadership.effectiveFrom,
                effectiveTo: officeLeadership.effectiveTo,
                personFirstName: people.firstName,
                personLastName: people.lastName,
              })
              .from(officeLeadership)
              .innerJoin(people, eq(officeLeadership.personId, people.id))
              .where(
                and(
                  eq(officeLeadership.division, office.division),
                  eq(officeLeadership.roleType, "divisional")
                )
              )
          : [];

      // VP for this office's division or company-wide
      const vpRows = await db
        .select({
          id: officeLeadership.id,
          officeId: officeLeadership.officeId,
          region: officeLeadership.region,
          division: officeLeadership.division,
          roleType: officeLeadership.roleType,
          personId: officeLeadership.personId,
          effectiveFrom: officeLeadership.effectiveFrom,
          effectiveTo: officeLeadership.effectiveTo,
          personFirstName: people.firstName,
          personLastName: people.lastName,
        })
        .from(officeLeadership)
        .innerJoin(people, eq(officeLeadership.personId, people.id))
        .where(
          and(
            eq(officeLeadership.roleType, "vp"),
            office.division != null
              ? or(
                  eq(officeLeadership.division, office.division),
                  isNull(officeLeadership.division)
                )
              : isNull(officeLeadership.division)
          )
        );

      return NextResponse.json({
        office: { id: office.id, name: office.name, region: office.region, division: office.division },
        ad: adRows,
        regional: regionalRows,
        divisional: divisionalRows,
        vp: vpRows,
      });
    } catch (error: unknown) {
      console.error("Error fetching office leadership:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
