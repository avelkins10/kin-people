import { db } from "@/lib/db";
import { commissionRules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { CommissionRule } from "@/lib/db/schema/commission-rules";

/**
 * Get all commission rules for a pay plan.
 */
export async function getRulesByPayPlan(
  payPlanId: string
): Promise<CommissionRule[]> {
  return await db
    .select()
    .from(commissionRules)
    .where(eq(commissionRules.payPlanId, payPlanId))
    .orderBy(commissionRules.sortOrder, commissionRules.createdAt);
}

/**
 * Get commission rules filtered by type for a pay plan.
 */
export async function getRulesByType(
  payPlanId: string,
  ruleType: string
): Promise<CommissionRule[]> {
  return await db
    .select()
    .from(commissionRules)
    .where(
      and(
        eq(commissionRules.payPlanId, payPlanId),
        eq(commissionRules.ruleType, ruleType),
        eq(commissionRules.isActive, true)
      )
    )
    .orderBy(commissionRules.sortOrder, commissionRules.createdAt);
}

/**
 * Get override rules with specific criteria.
 */
export async function getOverrideRules(
  payPlanId: string,
  overrideSource: string,
  overrideLevel: number
): Promise<CommissionRule[]> {
  return await db
    .select()
    .from(commissionRules)
    .where(
      and(
        eq(commissionRules.payPlanId, payPlanId),
        eq(commissionRules.ruleType, "override"),
        eq(commissionRules.overrideSource, overrideSource),
        eq(commissionRules.overrideLevel, overrideLevel),
        eq(commissionRules.isActive, true)
      )
    )
    .orderBy(commissionRules.sortOrder, commissionRules.createdAt);
}
