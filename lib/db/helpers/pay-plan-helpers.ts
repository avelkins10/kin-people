import { db } from "@/lib/db";
import { payPlans, commissionRules, personPayPlans } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import type { PayPlan } from "@/lib/db/schema/pay-plans";
import type { CommissionRule } from "@/lib/db/schema/commission-rules";

/**
 * Get a pay plan with all associated commission rules.
 */
export async function getPayPlanWithRules(
  payPlanId: string
): Promise<{ payPlan: PayPlan; rules: CommissionRule[] } | null> {
  const [payPlan] = await db
    .select()
    .from(payPlans)
    .where(eq(payPlans.id, payPlanId))
    .limit(1);

  if (!payPlan) {
    return null;
  }

  const rules = await db
    .select()
    .from(commissionRules)
    .where(eq(commissionRules.payPlanId, payPlanId))
    .orderBy(commissionRules.sortOrder, commissionRules.createdAt);

  return { payPlan, rules };
}

/**
 * Get all active pay plans.
 */
export async function getActivePayPlans(): Promise<PayPlan[]> {
  return await db
    .select()
    .from(payPlans)
    .where(eq(payPlans.isActive, true))
    .orderBy(payPlans.name);
}

/**
 * Get a person's current pay plan at a specific date.
 * If no date is provided, returns the current active pay plan.
 */
export async function getPersonCurrentPayPlan(
  personId: string,
  asOfDate?: string
): Promise<{
  payPlan: PayPlan;
  effectiveDate: string;
  notes: string | null;
} | null> {
  let query = db
    .select({
      payPlan: payPlans,
      effectiveDate: personPayPlans.effectiveDate,
      notes: personPayPlans.notes,
    })
    .from(personPayPlans)
    .innerJoin(payPlans, eq(personPayPlans.payPlanId, payPlans.id))
    .where(eq(personPayPlans.personId, personId));

  if (asOfDate) {
    // Find the pay plan active on the given date
    query = query.where(
      and(
        sql`${personPayPlans.effectiveDate} <= ${asOfDate}`,
        sql`(${personPayPlans.endDate} IS NULL OR ${personPayPlans.endDate} >= ${asOfDate})`
      )
    ) as any;
  } else {
    // Get current active pay plan
    query = query.where(isNull(personPayPlans.endDate)) as any;
  }

  const result = await query.orderBy(personPayPlans.effectiveDate).limit(1);

  return result[0] || null;
}

/**
 * Assign a pay plan to a person, ending the previous assignment.
 * Creates a new person_pay_plan record and ends the previous one.
 */
export async function assignPayPlanToPerson(
  personId: string,
  payPlanId: string,
  effectiveDate: string,
  notes?: string
): Promise<void> {
  await db.transaction(async (tx) => {
    // End current pay plan
    await tx
      .update(personPayPlans)
      .set({ endDate: effectiveDate })
      .where(
        and(
          eq(personPayPlans.personId, personId),
          isNull(personPayPlans.endDate)
        )
      );

    // Create new pay plan assignment
    await tx.insert(personPayPlans).values({
      personId,
      payPlanId,
      effectiveDate,
      notes: notes || null,
    });
  });
}
