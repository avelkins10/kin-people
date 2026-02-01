import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { commissionRules, payPlans, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

const ruleTypeEnum = z.enum([
  "setter_commission",
  "closer_commission",
  "self_gen_commission",
  "override",
  "recruiting_bonus",
  "draw",
]);

const calcMethodEnum = z.enum([
  "flat_per_kw",
  "percentage_of_deal",
  "flat_fee",
]);

const overrideSourceEnum = z.enum(["reports_to", "recruited_by"]);

const createCommissionRuleSchema = z.object({
  payPlanId: z.string().uuid(),
  name: z.string().max(100).optional(),
  ruleType: ruleTypeEnum,
  calcMethod: calcMethodEnum,
  amount: z.string().or(z.number()), // Decimal as string or number
  appliesToRoleId: z.string().uuid().optional(),
  overrideLevel: z.number().int().positive().optional(),
  overrideSource: overrideSourceEnum.optional(),
  dealTypes: z.array(z.string()).optional(),
  conditions: z.record(z.any()).optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const payPlanId = searchParams.get("payPlanId");

    let query = db
      .select({
        id: commissionRules.id,
        payPlanId: commissionRules.payPlanId,
        name: commissionRules.name,
        ruleType: commissionRules.ruleType,
        calcMethod: commissionRules.calcMethod,
        amount: commissionRules.amount,
        appliesToRoleId: commissionRules.appliesToRoleId,
        overrideLevel: commissionRules.overrideLevel,
        overrideSource: commissionRules.overrideSource,
        dealTypes: commissionRules.dealTypes,
        conditions: commissionRules.conditions,
        isActive: commissionRules.isActive,
        sortOrder: commissionRules.sortOrder,
        createdAt: commissionRules.createdAt,
        updatedAt: commissionRules.updatedAt,
        payPlanName: payPlans.name,
        appliesToRoleName: roles.name,
      })
      .from(commissionRules)
      .leftJoin(payPlans, eq(commissionRules.payPlanId, payPlans.id))
      .leftJoin(roles, eq(commissionRules.appliesToRoleId, roles.id));

    if (payPlanId) {
      query = query.where(eq(commissionRules.payPlanId, payPlanId)) as any;
    }

    const rules = await query.orderBy(
      commissionRules.sortOrder,
      commissionRules.createdAt
    );

    return NextResponse.json(rules);
  } catch (error: any) {
    console.error("Error fetching commission rules:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withPermission(
  Permission.MANAGE_SETTINGS,
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validated = createCommissionRuleSchema.parse(body);

      // Validate that pay plan exists
      const [payPlan] = await db
        .select()
        .from(payPlans)
        .where(eq(payPlans.id, validated.payPlanId))
        .limit(1);

      if (!payPlan) {
        return NextResponse.json(
          { error: "Pay plan not found" },
          { status: 404 }
        );
      }

      // Validate override rules have required fields
      if (validated.ruleType === "override") {
        if (!validated.overrideLevel || !validated.overrideSource) {
          return NextResponse.json(
            {
              error:
                "Override rules must have both overrideLevel and overrideSource",
            },
            { status: 400 }
          );
        }
      }

      // Validate that appliesToRoleId exists if provided
      if (validated.appliesToRoleId) {
        const [role] = await db
          .select()
          .from(roles)
          .where(eq(roles.id, validated.appliesToRoleId))
          .limit(1);

        if (!role) {
          return NextResponse.json(
            { error: "Role not found" },
            { status: 404 }
          );
        }
      }

      // Convert amount to string for decimal storage
      const amountString =
        typeof validated.amount === "number"
          ? validated.amount.toString()
          : validated.amount;

      const [newRule] = await db
        .insert(commissionRules)
        .values({
          payPlanId: validated.payPlanId,
          name: validated.name || null,
          ruleType: validated.ruleType,
          calcMethod: validated.calcMethod,
          amount: amountString,
          appliesToRoleId: validated.appliesToRoleId || null,
          overrideLevel: validated.overrideLevel || null,
          overrideSource: validated.overrideSource || null,
          dealTypes: validated.dealTypes || null,
          conditions: validated.conditions || {},
          isActive: validated.isActive,
          sortOrder: validated.sortOrder,
        })
        .returning();

      return NextResponse.json(newRule, { status: 201 });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error creating commission rule:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }
);
