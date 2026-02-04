import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { deals, people, offices } from "@/lib/db/schema";
import { eq, and, or, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { getDealVisibilityFilterAsync } from "@/lib/auth/visibility-rules";
import { calculateCommissionsForDeal } from "@/lib/services/commission-calculator";

const createDealSchema = z.object({
  setterId: z.string().uuid(),
  closerId: z.string().uuid(),
  dealType: z.string().min(1),
  systemSizeKw: z.string().optional(),
  ppw: z.string().optional(),
  dealValue: z.string().min(1),
  saleDate: z.string().optional(),
  closeDate: z.string().optional(),
  installDate: z.string().optional(),
  ptoDate: z.string().optional(),
  customerName: z.string().optional(),
  customerAddress: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  officeId: z.string().uuid().optional(),
  status: z.string().optional().default("sold"),
  quickbaseId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const officeId = searchParams.get("officeId");
    const status = searchParams.get("status");
    const dealType = searchParams.get("dealType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const setterId = searchParams.get("setterId");
    const closerId = searchParams.get("closerId");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : undefined;

    // Build base query with joins
    let query = db
      .select({
        deal: deals,
        setter: {
          id: people.id,
          firstName: people.firstName,
          lastName: people.lastName,
          email: people.email,
        },
        closer: {
          id: people.id,
          firstName: people.firstName,
          lastName: people.lastName,
          email: people.email,
        },
        office: {
          id: offices.id,
          name: offices.name,
        },
      })
      .from(deals)
      .leftJoin(people, eq(deals.setterId, people.id))
      .leftJoin(offices, eq(deals.officeId, offices.id));

    // Join closer separately (need to alias)
    const closerAlias = people;
    // Note: Drizzle doesn't support multiple joins of same table easily
    // We'll need to fetch closer separately or use a subquery
    // For now, let's fetch closer in a separate query or use a different approach

    // Build all filter conditions together
    const conditions: any[] = [];

    // Apply visibility filters first (using async hierarchy-based filter)
    const visibilityFilter = await getDealVisibilityFilterAsync(user);
    if (visibilityFilter) {
      if (visibilityFilter.officeIds && visibilityFilter.officeIds.length > 0) {
        // Regional Manager: deals from any office in their region
        conditions.push(inArray(deals.officeId, visibilityFilter.officeIds));
      } else if (visibilityFilter.officeId) {
        // Area Director/Team Lead: deals from their office
        conditions.push(eq(deals.officeId, visibilityFilter.officeId));
      } else if (visibilityFilter.setterId) {
        // Sales rep sees their own deals (as setter or closer)
        conditions.push(
          or(eq(deals.setterId, visibilityFilter.setterId), eq(deals.closerId, visibilityFilter.setterId))
        );
      }
    }

    // Apply additional user-supplied filters
    if (officeId) {
      conditions.push(eq(deals.officeId, officeId));
    }
    if (status) {
      conditions.push(eq(deals.status, status));
    }
    if (dealType) {
      conditions.push(eq(deals.dealType, dealType));
    }
    if (setterId) {
      conditions.push(eq(deals.setterId, setterId));
    }
    if (closerId) {
      conditions.push(eq(deals.closerId, closerId));
    }
    if (startDate) {
      conditions.push(gte(sql`coalesce(${deals.closeDate}, ${deals.saleDate})`, startDate));
    }
    if (endDate) {
      conditions.push(lte(sql`coalesce(${deals.closeDate}, ${deals.saleDate})`, endDate));
    }

    // Apply all conditions together in a single where clause
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Order by created date (most recent first)
    query = query.orderBy(desc(deals.createdAt)) as any;

    if (limit !== undefined) {
      query = query.limit(limit) as any;
    }

    const results = await query;

    // Fetch closer details separately for each deal
    const dealsWithCloser = await Promise.all(
      results.map(async (result) => {
        const [closerData] = await db
          .select({
            id: people.id,
            firstName: people.firstName,
            lastName: people.lastName,
            email: people.email,
          })
          .from(people)
          .where(eq(people.id, result.deal.closerId))
          .limit(1);

        return {
          ...result,
          closer: closerData || null,
        };
      })
    );

    return NextResponse.json(dealsWithCloser);
  } catch (error: any) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withPermission(Permission.CREATE_DEALS, async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const validated = createDealSchema.parse(body);

    // Calculate isSelfGen
    const isSelfGen = validated.setterId === validated.closerId;

    // Auto-calculate dealValue if systemSizeKw and ppw provided
    let dealValue = validated.dealValue;
    if (validated.systemSizeKw && validated.ppw) {
      const calculatedValue = parseFloat(validated.systemSizeKw) * parseFloat(validated.ppw) * 1000;
      if (!dealValue || parseFloat(dealValue) === 0) {
        dealValue = calculatedValue.toString();
      }
    }

    // Create deal record
    const [newDeal] = await db
      .insert(deals)
      .values({
        setterId: validated.setterId,
        closerId: validated.closerId,
        isSelfGen,
        officeId: validated.officeId || null,
        dealType: validated.dealType,
        systemSizeKw: validated.systemSizeKw || null,
        ppw: validated.ppw || null,
        dealValue: dealValue,
        saleDate: validated.saleDate || null,
        closeDate: validated.closeDate || null,
        installDate: validated.installDate || null,
        ptoDate: validated.ptoDate || null,
        customerName: validated.customerName || null,
        customerAddress: validated.customerAddress || null,
        customerEmail: validated.customerEmail || null,
        customerPhone: validated.customerPhone || null,
        status: validated.status || "sold",
        quickbaseId: validated.quickbaseId || null,
        metadata: validated.metadata || {},
      })
      .returning();

    // Immediately trigger commission calculation
    let commissionCount = 0;
    try {
      commissionCount = await calculateCommissionsForDeal(newDeal.id);
    } catch (calcError: any) {
      console.error("Error calculating commissions:", calcError);
      // Don't fail the deal creation, but log the error
    }

    // Fetch deal with details
    const [setterData] = await db
      .select()
      .from(people)
      .where(eq(people.id, newDeal.setterId))
      .limit(1);

    const [closerData] = await db
      .select()
      .from(people)
      .where(eq(people.id, newDeal.closerId))
      .limit(1);

    const [officeData] = await db
      .select()
      .from(offices)
      .where(eq(offices.id, newDeal.officeId || ""))
      .limit(1);

    return NextResponse.json(
      {
        deal: newDeal,
        setter: setterData
          ? {
              id: setterData.id,
              firstName: setterData.firstName,
              lastName: setterData.lastName,
              email: setterData.email,
            }
          : null,
        closer: closerData
          ? {
              id: closerData.id,
              firstName: closerData.firstName,
              lastName: closerData.lastName,
              email: closerData.email,
            }
          : null,
        office: officeData
          ? {
              id: officeData.id,
              name: officeData.name,
            }
          : null,
        commissionCount,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});
