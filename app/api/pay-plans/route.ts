import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { payPlans, commissionRules, personPayPlans } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = db.select().from(payPlans);

    if (activeOnly) {
      query = query.where(eq(payPlans.isActive, true)) as any;
    }

    const payPlansList = await query;

    // Fetch counts for each pay plan
    const payPlansWithCounts = await Promise.all(
      payPlansList.map(async (plan) => {
        const [rulesCountResult, peopleCountResult] = await Promise.all([
          db
            .select({ count: sql<number>`COUNT(*)::int` })
            .from(commissionRules)
            .where(eq(commissionRules.payPlanId, plan.id)),
          db
            .select({ count: sql<number>`COUNT(DISTINCT ${personPayPlans.personId})::int` })
            .from(personPayPlans)
            .where(
              and(
                eq(personPayPlans.payPlanId, plan.id),
                isNull(personPayPlans.endDate)
              )
            ),
        ]);

        return {
          ...plan,
          rulesCount: rulesCountResult[0]?.count || 0,
          peopleCount: peopleCountResult[0]?.count || 0,
        };
      })
    );

    return NextResponse.json(payPlansWithCounts);
  } catch (error: any) {
    console.error("Error fetching pay plans:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});

const createPayPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const POST = withPermission(
  Permission.MANAGE_SETTINGS,
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validated = createPayPlanSchema.parse(body);

      const [newPayPlan] = await db
        .insert(payPlans)
        .values({
          name: validated.name,
          description: validated.description || null,
          isActive: validated.isActive,
        })
        .returning();

      return NextResponse.json(newPayPlan, { status: 201 });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error creating pay plan:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }
);
