import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commissions, deals, people, offices } from "@/lib/db/schema";
import { eq, and, or, desc, gte, lte, sql, like } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";
import { getCommissionVisibilityFilter, getCommissionsForDeal } from "@/lib/auth/visibility-rules";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const dateStart = searchParams.get("dateStart");
    const dateEnd = searchParams.get("dateEnd");
    const status = searchParams.get("status");
    const dealType = searchParams.get("dealType");
    const commissionType = searchParams.get("commissionType");
    const tab = searchParams.get("tab") || "my-deals";

    // Build base query with joins
    let query = db
      .select({
        commission: commissions,
        deal: {
          id: deals.id,
          customerName: deals.customerName,
          closeDate: deals.closeDate,
          dealType: deals.dealType,
          dealValue: deals.dealValue,
          systemSizeKw: deals.systemSizeKw,
          ppw: deals.ppw,
          setterId: deals.setterId,
          closerId: deals.closerId,
          isSelfGen: deals.isSelfGen,
        },
        person: {
          id: people.id,
          firstName: people.firstName,
          lastName: people.lastName,
          email: people.email,
        },
        setter: {
          id: people.id,
          firstName: people.firstName,
          lastName: people.lastName,
        },
        closer: {
          id: people.id,
          firstName: people.firstName,
          lastName: people.lastName,
        },
        office: {
          id: offices.id,
          name: offices.name,
        },
      })
      .from(commissions)
      .innerJoin(deals, eq(commissions.dealId, deals.id))
      .innerJoin(people, eq(commissions.personId, people.id))
      .leftJoin(offices, eq(deals.officeId, offices.id));

    // Join setter separately
    const setterAlias = people;
    // Note: We'll fetch setter/closer separately due to Drizzle limitations

    // Build filter conditions
    const conditions: any[] = [];

    // Apply visibility filters based on tab
    const visibilityFilter = getCommissionVisibilityFilter(user, tab);
    if (visibilityFilter) {
      if (visibilityFilter.personId) {
        conditions.push(eq(commissions.personId, visibilityFilter.personId));
      }
      if (visibilityFilter.officeId) {
        // Need to join deals to filter by office
        conditions.push(eq(deals.officeId, visibilityFilter.officeId));
      }
      if (visibilityFilter.commissionTypes) {
        // Filter by commission types user can see
        const typeConditions = visibilityFilter.commissionTypes.map((type) =>
          eq(commissions.commissionType, type)
        );
        conditions.push(or(...typeConditions));
      }
    }

    // Tab-specific filtering
    if (tab === "my-deals") {
      // For "my-deals": apply person-level filtering only for reps
      // Admins/managers rely on office/role scope from visibilityFilter
      
      // Check if user is a rep (has VIEW_OWN_DATA_ONLY permission)
      const isRep = hasPermission(user, Permission.VIEW_OWN_DATA_ONLY) &&
        !hasPermission(user, Permission.VIEW_ALL_PEOPLE) &&
        !hasPermission(user, Permission.MANAGE_OWN_REGION) &&
        !hasPermission(user, Permission.MANAGE_OWN_OFFICE) &&
        !hasPermission(user, Permission.MANAGE_OWN_TEAM);
      
      if (isRep) {
        // For reps: apply person-level filtering
        // First, check if user is a closer
        const closerDeals = await db
          .select({ dealId: commissions.dealId })
          .from(commissions)
          .innerJoin(deals, eq(commissions.dealId, deals.id))
          .where(
            and(
              eq(commissions.personId, user.id),
              eq(commissions.commissionType, "closer")
            )
          );

        if (closerDeals.length > 0) {
          // User is a Closer - include their commissions AND Setter commissions for same deals
          const dealIds = closerDeals.map((d) => d.dealId);
          conditions.push(
            or(
              eq(commissions.personId, user.id),
              and(
                eq(commissions.commissionType, "setter"),
                sql`${commissions.dealId} = ANY(${dealIds})`
              )
            )
          );
        } else {
          // Regular rep (Setter or Self-Gen) - only their commissions
          conditions.push(eq(commissions.personId, user.id));
        }
      }
      // For admins/managers: visibilityFilter is null or has officeId
      // Don't add person-level filter - rely on office/role scope from visibilityFilter
      
      // Exclude override commissions from my-deals tab
      conditions.push(sql`${commissions.commissionType} NOT LIKE 'override_%'`);
    } else if (tab === "overrides") {
      // For "overrides": show only override commissions
      conditions.push(like(commissions.commissionType, "override_%"));
      // Apply visibility filter for override commissions
      if (visibilityFilter?.personId) {
        conditions.push(eq(commissions.personId, visibilityFilter.personId));
      }
    } else if (tab === "team") {
      // Team/office scope (same as deals list): visibilityFilter already applied; exclude overrides
      conditions.push(sql`${commissions.commissionType} NOT LIKE 'override_%'`);
    }

    // Apply additional filters
    if (status) {
      conditions.push(eq(commissions.status, status));
    }
    if (commissionType) {
      conditions.push(eq(commissions.commissionType, commissionType));
    }
    if (dealType) {
      conditions.push(eq(deals.dealType, dealType));
    }
    if (dateStart) {
      conditions.push(
        gte(
          sql`coalesce(${deals.closeDate}, ${deals.saleDate})`,
          dateStart
        )
      );
    }
    if (dateEnd) {
      conditions.push(
        lte(
          sql`coalesce(${deals.closeDate}, ${deals.saleDate})`,
          dateEnd
        )
      );
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Order by deal close date (most recent first)
    query = query.orderBy(desc(deals.closeDate)) as any;

    const results = await query;

    // Fetch setter and closer details separately for each deal
    const commissionsWithDetails = await Promise.all(
      results.map(async (result) => {
        // Fetch setter
        const [setterData] = await db
          .select({
            id: people.id,
            firstName: people.firstName,
            lastName: people.lastName,
            setterTier: people.setterTier,
          })
          .from(people)
          .where(eq(people.id, result.deal.setterId))
          .limit(1);

        // Fetch closer
        const [closerData] = await db
          .select({
            id: people.id,
            firstName: people.firstName,
            lastName: people.lastName,
          })
          .from(people)
          .where(eq(people.id, result.deal.closerId))
          .limit(1);

        return {
          ...result,
          setter: setterData || null,
          closer: closerData || null,
        };
      })
    );

    return NextResponse.json(commissionsWithDetails);
  } catch (error: any) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});
