import { db } from "@/lib/db";
import { commissionRules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { CommissionRule } from "@/lib/db/schema/commission-rules";

/**
 * Context for evaluating commission rules against a deal/person.
 */
export interface RuleEvaluationContext {
  dealType: string;
  systemSizeKw: number;
  dealValue: number;
  ppw: number;
  setterTier: "Rookie" | "Veteran" | "Team Lead" | null;
  personRoleId: string;
}

/**
 * Check if a commission rule applies based on the evaluation context.
 * 
 * @param rule - The commission rule to evaluate
 * @param context - The context (deal details, person info)
 * @returns true if the rule applies, false otherwise
 */
export function evaluateRule(
  rule: CommissionRule,
  context: RuleEvaluationContext
): boolean {
  const conditions = (rule.conditions as any) || {};

  // Check setter tier condition
  if (conditions.setter_tier) {
    const requiredTiers = Array.isArray(conditions.setter_tier)
      ? conditions.setter_tier
      : [conditions.setter_tier];

    if (!context.setterTier || !requiredTiers.includes(context.setterTier)) {
      return false;
    }
  }

  // Check deal types condition
  if (conditions.deal_types && Array.isArray(conditions.deal_types)) {
    if (!conditions.deal_types.includes(context.dealType.toLowerCase())) {
      return false;
    }
  }

  // Check minimum kW condition
  if (conditions.min_kw !== undefined && conditions.min_kw !== null) {
    if (context.systemSizeKw < conditions.min_kw) {
      return false;
    }
  }

  // Check PPW floor condition
  if (conditions.ppw_floor !== undefined && conditions.ppw_floor !== null) {
    if (context.ppw < conditions.ppw_floor) {
      return false;
    }
  }

  // Check role condition
  if (rule.appliesToRoleId) {
    if (context.personRoleId !== rule.appliesToRoleId) {
      return false;
    }
  }

  // Rule applies if all conditions pass
  return true;
}

/**
 * Calculate the commission amount for a rule given the context.
 * 
 * @param rule - The commission rule
 * @param context - The evaluation context
 * @returns The calculated commission amount
 */
export function calculateCommissionAmount(
  rule: CommissionRule,
  context: RuleEvaluationContext
): number {
  const amount = parseFloat(rule.amount);

  switch (rule.calcMethod) {
    case "flat_per_kw":
      return amount * context.systemSizeKw;

    case "percentage_of_deal":
      return (amount / 100) * context.dealValue;

    case "flat_fee":
      return amount;

    default:
      console.warn(`Unknown calculation method: ${rule.calcMethod}`);
      return 0;
  }
}

/**
 * Get all applicable rules from a list, filtered and sorted.
 * 
 * @param rules - Array of commission rules to evaluate
 * @param context - The evaluation context
 * @returns Array of applicable rules sorted by sortOrder
 */
export function getApplicableRules(
  rules: CommissionRule[],
  context: RuleEvaluationContext
): CommissionRule[] {
  return rules
    .filter((rule) => {
      // Only active rules
      if (!rule.isActive) {
        return false;
      }

      // Evaluate rule conditions
      return evaluateRule(rule, context);
    })
    .sort((a, b) => {
      // Sort by sortOrder, then by creation date
      if (a.sortOrder !== b.sortOrder) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      return (
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      );
    });
}

/**
 * Get all commission rules for a pay plan, optionally filtered by rule type.
 * 
 * @param payPlanId - The pay plan ID
 * @param ruleType - Optional rule type filter
 * @returns Array of active commission rules
 */
export async function getRulesForPayPlan(
  payPlanId: string,
  ruleType?: string
): Promise<CommissionRule[]> {
  const whereConditions = ruleType
    ? and(
        eq(commissionRules.payPlanId, payPlanId),
        eq(commissionRules.isActive, true),
        eq(commissionRules.ruleType, ruleType)
      )
    : and(
        eq(commissionRules.payPlanId, payPlanId),
        eq(commissionRules.isActive, true)
      );

  const rules = await db
    .select()
    .from(commissionRules)
    .where(whereConditions)
    .orderBy(commissionRules.sortOrder, commissionRules.createdAt);

  return rules;
}
