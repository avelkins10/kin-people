import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { commissionRules, payPlans, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

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

const updateCommissionRuleSchema = z.object({
  payPlanId: z.string().uuid().optional(),
  name: z.string().max(100).optional(),
  ruleType: ruleTypeEnum.optional(),
  calcMethod: calcMethodEnum.optional(),
  amount: z.string().or(z.number()).optional(),
  appliesToRoleId: z.string().uuid().optional().nullable(),
  overrideLevel: z.number().int().positive().optional().nullable(),
  overrideSource: overrideSourceEnum.optional().nullable(),
  dealTypes: z.array(z.string()).optional().nullable(),
  conditions: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
    try {
      const [rule] = await db
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
        .leftJoin(roles, eq(commissionRules.appliesToRoleId, roles.id))
        .where(eq(commissionRules.id, id))
        .limit(1);

      if (!rule) {
        return NextResponse.json(
          { error: "Commission rule not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(rule);
    } catch (error: any) {
      console.error("Error fetching commission rule:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
    try {
      const body = await req.json();
      const validated = updateCommissionRuleSchema.parse(body);

      // Check if rule exists
      const [existing] = await db
        .select()
        .from(commissionRules)
        .where(eq(commissionRules.id, id))
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { error: "Commission rule not found" },
          { status: 404 }
        );
      }

      // Validate pay plan if being updated
      if (validated.payPlanId) {
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
      }

      // Validate override rules
      const ruleType = validated.ruleType || existing.ruleType;
      if (ruleType === "override") {
        const overrideLevel =
          validated.overrideLevel !== undefined
            ? validated.overrideLevel
            : existing.overrideLevel;
        const overrideSource =
          validated.overrideSource !== undefined
            ? validated.overrideSource
            : existing.overrideSource;

        if (!overrideLevel || !overrideSource) {
          return NextResponse.json(
            {
              error:
                "Override rules must have both overrideLevel and overrideSource",
            },
            { status: 400 }
          );
        }
      }

      // Validate role if being updated
      if (validated.appliesToRoleId !== undefined) {
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
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (validated.payPlanId !== undefined) {
        updateData.payPlanId = validated.payPlanId;
      }
      if (validated.name !== undefined) {
        updateData.name = validated.name || null;
      }
      if (validated.ruleType !== undefined) {
        updateData.ruleType = validated.ruleType;
      }
      if (validated.calcMethod !== undefined) {
        updateData.calcMethod = validated.calcMethod;
      }
      if (validated.amount !== undefined) {
        updateData.amount =
          typeof validated.amount === "number"
            ? validated.amount.toString()
            : validated.amount;
      }
      if (validated.appliesToRoleId !== undefined) {
        updateData.appliesToRoleId = validated.appliesToRoleId || null;
      }
      if (validated.overrideLevel !== undefined) {
        updateData.overrideLevel = validated.overrideLevel || null;
      }
      if (validated.overrideSource !== undefined) {
        updateData.overrideSource = validated.overrideSource || null;
      }
      if (validated.dealTypes !== undefined) {
        updateData.dealTypes = validated.dealTypes || null;
      }
      if (validated.conditions !== undefined) {
        updateData.conditions = validated.conditions;
      }
      if (validated.isActive !== undefined) {
        updateData.isActive = validated.isActive;
      }
      if (validated.sortOrder !== undefined) {
        updateData.sortOrder = validated.sortOrder;
      }

      const [updated] = await db
        .update(commissionRules)
        .set(updateData)
        .where(eq(commissionRules.id, id))
        .returning();

      await logActivity({
        entityType: "commission_rule",
        entityId: id,
        action: "updated",
        details: { previous: { ruleType: existing.ruleType, calcMethod: existing.calcMethod, amount: existing.amount, isActive: existing.isActive }, new: { ruleType: updated.ruleType, calcMethod: updated.calcMethod, amount: updated.amount, isActive: updated.isActive } },
        actorId: user.id,
      });

      return NextResponse.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating commission rule:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
    try {
      // Check if rule exists
      const [existing] = await db
        .select()
        .from(commissionRules)
        .where(eq(commissionRules.id, id))
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { error: "Commission rule not found" },
          { status: 404 }
        );
      }

      // Soft delete by setting isActive to false
      const [deleted] = await db
        .update(commissionRules)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(commissionRules.id, id))
        .returning();

      if (deleted) {
        await logActivity({
          entityType: "commission_rule",
          entityId: id,
          action: "deleted",
          details: { ruleType: deleted.ruleType, payPlanId: deleted.payPlanId },
          actorId: user.id,
        });
      }

      return NextResponse.json({ success: true, rule: deleted });
    } catch (error: any) {
      console.error("Error deleting commission rule:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
