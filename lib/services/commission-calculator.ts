import { db } from "@/lib/db";
import { deals, commissions, people, offices, officeLeadership } from "@/lib/db/schema";
import { eq, and, or, lte, gte, isNull } from "drizzle-orm";
import { getOrCreateOrgSnapshot } from "@/lib/db/helpers/org-snapshot-helpers";
import { getPersonCurrentPayPlan } from "@/lib/db/helpers/pay-plan-helpers";
import {
  getRulesForPayPlan,
  getApplicableRules,
  calculateCommissionAmount,
  evaluateRule,
  type RuleEvaluationContext,
} from "./commission-rule-evaluator";
import type { Deal } from "@/lib/db/schema/deals";
import type { OrgSnapshot } from "@/lib/db/schema/org-snapshots";
import type { CommissionRule } from "@/lib/db/schema/commission-rules";
import type { PayPlan } from "@/lib/db/schema/pay-plans";

/**
 * Main entry point for calculating commissions for a deal.
 * Orchestrates the entire commission calculation flow.
 */
export async function calculateCommissionsForDeal(dealId: string): Promise<number> {
  // Make calculation idempotent: delete existing commissions for this deal
  await db.delete(commissions).where(eq(commissions.dealId, dealId));

  // Fetch deal with setter and closer
  const [dealData] = await db
    .select({
      deal: deals,
      setter: {
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        setterTier: people.setterTier,
      },
      closer: {
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
      },
    })
    .from(deals)
    .innerJoin(people, eq(deals.setterId, people.id))
    .where(eq(deals.id, dealId))
    .limit(1);

  if (!dealData) {
    throw new Error(`Deal not found: ${dealId}`);
  }

  const { deal, setter } = dealData;

  // Fetch closer separately
  const [closerData] = await db
    .select()
    .from(people)
    .where(eq(people.id, deal.closerId))
    .limit(1);

  if (!closerData) {
    throw new Error(`Closer not found: ${deal.closerId}`);
  }

  const closer = {
    id: closerData.id,
    firstName: closerData.firstName,
    lastName: closerData.lastName,
  };

  // Determine snapshot date (use close_date or sale_date or current date)
  const snapshotDate = deal.closeDate || deal.saleDate || new Date().toISOString().split("T")[0];

  // Check if self-gen deal
  const isSelfGen = deal.isSelfGen || deal.setterId === deal.closerId;

  let commissionCount = 0;

  if (isSelfGen) {
    // Self-gen deal: single commission
    const snapshot = await getOrCreateOrgSnapshot(deal.setterId, snapshotDate);
    const payPlanData = await getPersonCurrentPayPlan(deal.setterId, snapshotDate);

    if (payPlanData) {
      const commission = await calculateSelfGenCommission(
        deal,
        snapshot,
        payPlanData.payPlan
      );
      if (commission) {
        commissionCount++;
      }
    }
  } else {
    // Separate setter and closer: calculate both commissions
    const setterSnapshot = await getOrCreateOrgSnapshot(deal.setterId, snapshotDate);
    const setterPayPlanData = await getPersonCurrentPayPlan(deal.setterId, snapshotDate);

    if (setterPayPlanData) {
      const commission = await calculateSetterCommission(
        deal,
        setterSnapshot,
        setterPayPlanData.payPlan
      );
      if (commission) {
        commissionCount++;
      }
    }

    const closerSnapshot = await getOrCreateOrgSnapshot(deal.closerId, snapshotDate);
    const closerPayPlanData = await getPersonCurrentPayPlan(deal.closerId, snapshotDate);

    if (closerPayPlanData) {
      const commission = await calculateCloserCommission(
        deal,
        closerSnapshot,
        closerPayPlanData.payPlan
      );
      if (commission) {
        commissionCount++;
      }
    }
  }

  // Calculate leadership overrides (based on setter's hierarchy)
  const setterSnapshot = await getOrCreateOrgSnapshot(deal.setterId, snapshotDate);
  const overrideCount = await calculateLeadershipOverrides(deal, setterSnapshot);
  commissionCount += overrideCount;

  // Calculate recruiting overrides (based on setter's recruited_by chain)
  const recruitingCount = await calculateRecruitingOverrides(deal, setterSnapshot);
  commissionCount += recruitingCount;

  // Calculate office-hierarchy overrides (AD/Regional/Divisional/VP for deal's office)
  const officeHierarchyCount = await calculateOfficeHierarchyOverrides(deal, snapshotDate);
  commissionCount += officeHierarchyCount;

  return commissionCount;
}

/**
 * Calculate setter commission for a deal.
 */
async function calculateSetterCommission(
  deal: Deal,
  snapshot: OrgSnapshot,
  payPlan: PayPlan
): Promise<string | null> {
  const rules = await getRulesForPayPlan(payPlan.id, "setter_commission");

  if (rules.length === 0) {
    console.warn(`No setter commission rules found for pay plan: ${payPlan.id}`);
    return null;
  }

  const context: RuleEvaluationContext = {
    dealType: deal.dealType,
    systemSizeKw: parseFloat(deal.systemSizeKw || "0"),
    dealValue: parseFloat(deal.dealValue),
    ppw: parseFloat(deal.ppw || "0"),
    setterTier: (snapshot.setterTier as "Rookie" | "Veteran" | "Team Lead" | null) || null,
    personRoleId: snapshot.roleId || "",
  };

  const applicableRules = getApplicableRules(rules, context);

  if (applicableRules.length === 0) {
    console.warn(`No applicable setter commission rules for deal: ${deal.id}`);
    return null;
  }

  // Use the first applicable rule (sorted by sortOrder)
  const rule = applicableRules[0];
  const amount = calculateCommissionAmount(rule, context);

  const calcDetails = buildCalcDetails(rule, deal, snapshot, amount);

  const [commission] = await db
    .insert(commissions)
    .values({
      dealId: deal.id,
      personId: deal.setterId,
      commissionType: "setter",
      amount: amount.toString(),
      commissionRuleId: rule.id,
      payPlanId: payPlan.id,
      calcDetails,
      status: "pending",
    })
    .returning();

  return commission.id;
}

/**
 * Calculate closer commission for a deal.
 */
async function calculateCloserCommission(
  deal: Deal,
  snapshot: OrgSnapshot,
  payPlan: PayPlan
): Promise<string | null> {
  const rules = await getRulesForPayPlan(payPlan.id, "closer_commission");

  if (rules.length === 0) {
    console.warn(`No closer commission rules found for pay plan: ${payPlan.id}`);
    return null;
  }

  const context: RuleEvaluationContext = {
    dealType: deal.dealType,
    systemSizeKw: parseFloat(deal.systemSizeKw || "0"),
    dealValue: parseFloat(deal.dealValue),
    ppw: parseFloat(deal.ppw || "0"),
    setterTier: null, // Closer commission doesn't depend on setter tier
    personRoleId: snapshot.roleId || "",
  };

  const applicableRules = getApplicableRules(rules, context);

  if (applicableRules.length === 0) {
    console.warn(`No applicable closer commission rules for deal: ${deal.id}`);
    return null;
  }

  const rule = applicableRules[0];
  const amount = calculateCommissionAmount(rule, context);

  const calcDetails = buildCalcDetails(rule, deal, snapshot, amount);

  const [commission] = await db
    .insert(commissions)
    .values({
      dealId: deal.id,
      personId: deal.closerId,
      commissionType: "closer",
      amount: amount.toString(),
      commissionRuleId: rule.id,
      payPlanId: payPlan.id,
      calcDetails,
      status: "pending",
    })
    .returning();

  return commission.id;
}

/**
 * Calculate self-gen commission when setter and closer are the same person.
 */
async function calculateSelfGenCommission(
  deal: Deal,
  snapshot: OrgSnapshot,
  payPlan: PayPlan
): Promise<string | null> {
  const rules = await getRulesForPayPlan(payPlan.id, "self_gen_commission");

  if (rules.length === 0) {
    console.warn(`No self-gen commission rules found for pay plan: ${payPlan.id}`);
    return null;
  }

  const context: RuleEvaluationContext = {
    dealType: deal.dealType,
    systemSizeKw: parseFloat(deal.systemSizeKw || "0"),
    dealValue: parseFloat(deal.dealValue),
    ppw: parseFloat(deal.ppw || "0"),
    setterTier: (snapshot.setterTier as "Rookie" | "Veteran" | "Team Lead" | null) || null,
    personRoleId: snapshot.roleId || "",
  };

  const applicableRules = getApplicableRules(rules, context);

  if (applicableRules.length === 0) {
    console.warn(`No applicable self-gen commission rules for deal: ${deal.id}`);
    return null;
  }

  const rule = applicableRules[0];
  const amount = calculateCommissionAmount(rule, context);

  const calcDetails = buildCalcDetails(rule, deal, snapshot, amount);

  const [commission] = await db
    .insert(commissions)
    .values({
      dealId: deal.id,
      personId: deal.setterId, // Same person for self-gen
      commissionType: "self_gen",
      amount: amount.toString(),
      commissionRuleId: rule.id,
      payPlanId: payPlan.id,
      calcDetails,
      status: "pending",
    })
    .returning();

  return commission.id;
}

/**
 * Calculate leadership overrides by walking the setter's reports_to chain.
 */
async function calculateLeadershipOverrides(
  deal: Deal,
  setterSnapshot: OrgSnapshot
): Promise<number> {
  if (!setterSnapshot.reportsToId) {
    return 0; // No manager, no overrides
  }

  let count = 0;
  let currentPersonId: string | null = setterSnapshot.reportsToId;
  let level = 1;
  const maxLevels = 4; // Team Lead → Area Director → Regional Manager → VP

  while (currentPersonId && level <= maxLevels) {
    // Get manager's snapshot at deal close date
    const snapshotDate = deal.closeDate || deal.saleDate || new Date().toISOString().split("T")[0];
    const managerSnapshot = await getOrCreateOrgSnapshot(currentPersonId, snapshotDate);

    // Get manager's pay plan
    const payPlanData = await getPersonCurrentPayPlan(currentPersonId, snapshotDate);
    if (!payPlanData) {
      // No pay plan, skip this level
      currentPersonId = managerSnapshot.reportsToId || null;
      level++;
      continue;
    }

    // Get override rules for this pay plan
    const rules = await getRulesForPayPlan(payPlanData.payPlan.id, "override");

    // Filter rules that match:
    // 1. override_source = 'reports_to'
    // 2. override_level matches current level (or is null/0 for any level)
    // 3. Conditions match (setter tier, etc.)
    const context: RuleEvaluationContext = {
      dealType: deal.dealType,
      systemSizeKw: parseFloat(deal.systemSizeKw || "0"),
      dealValue: parseFloat(deal.dealValue),
      ppw: parseFloat(deal.ppw || "0"),
      setterTier: (setterSnapshot.setterTier as "Rookie" | "Veteran" | "Team Lead" | null) || null,
      personRoleId: managerSnapshot.roleId || "",
    };

    const applicableRules = rules.filter((rule) => {
      // Check override_source
      if (rule.overrideSource !== "reports_to") {
        return false;
      }

      // Check override_level (null or 0 means any level)
      if (rule.overrideLevel !== null && rule.overrideLevel !== 0 && rule.overrideLevel !== level) {
        return false;
      }

      // Evaluate rule conditions
      return evaluateRule(rule, context);
    });

    if (applicableRules.length > 0) {
      // Use first applicable rule
      const rule = applicableRules[0];
      const amount = calculateCommissionAmount(rule, context);

      const calcDetails = buildCalcDetails(rule, deal, managerSnapshot, amount, {
        overrideLevel: level,
        setterSnapshot,
      });

      await db.insert(commissions).values({
        dealId: deal.id,
        personId: currentPersonId,
        commissionType: `override_reports_to_l${level}` as any,
        amount: amount.toString(),
        commissionRuleId: rule.id,
        payPlanId: payPlanData.payPlan.id,
        calcDetails,
        status: "pending",
      });

      count++;
    }

    // Move up the chain
    currentPersonId = managerSnapshot.reportsToId || null;
    level++;
  }

  return count;
}

/**
 * Calculate recruiting overrides by walking the setter's recruited_by chain.
 */
async function calculateRecruitingOverrides(
  deal: Deal,
  setterSnapshot: OrgSnapshot
): Promise<number> {
  if (!setterSnapshot.recruitedById) {
    return 0; // No recruiter, no overrides
  }

  let count = 0;
  let currentPersonId: string | null = setterSnapshot.recruitedById;
  let level = 1;
  const maxLevels = 2; // Typically 1-2 levels of recruiting overrides

  while (currentPersonId && level <= maxLevels) {
    // Get recruiter's snapshot at deal close date
    const snapshotDate = deal.closeDate || deal.saleDate || new Date().toISOString().split("T")[0];
    const recruiterSnapshot = await getOrCreateOrgSnapshot(currentPersonId, snapshotDate);

    // Get recruiter's pay plan
    const payPlanData = await getPersonCurrentPayPlan(currentPersonId, snapshotDate);
    if (!payPlanData) {
      // No pay plan, skip this level
      currentPersonId = recruiterSnapshot.recruitedById || null;
      level++;
      continue;
    }

    // Get override rules for this pay plan
    const rules = await getRulesForPayPlan(payPlanData.payPlan.id, "override");

    // Filter rules that match:
    // 1. override_source = 'recruited_by'
    // 2. override_level matches current level (or is null/0 for any level)
    // 3. Conditions match
    const context: RuleEvaluationContext = {
      dealType: deal.dealType,
      systemSizeKw: parseFloat(deal.systemSizeKw || "0"),
      dealValue: parseFloat(deal.dealValue),
      ppw: parseFloat(deal.ppw || "0"),
      setterTier: (setterSnapshot.setterTier as "Rookie" | "Veteran" | "Team Lead" | null) || null,
      personRoleId: recruiterSnapshot.roleId || "",
    };

    const applicableRules = rules.filter((rule) => {
      // Check override_source
      if (rule.overrideSource !== "recruited_by") {
        return false;
      }

      // Check override_level (null or 0 means any level)
      if (rule.overrideLevel !== null && rule.overrideLevel !== 0 && rule.overrideLevel !== level) {
        return false;
      }

      // Evaluate rule conditions
      return evaluateRule(rule, context);
    });

    if (applicableRules.length > 0) {
      // Use first applicable rule
      const rule = applicableRules[0];
      const amount = calculateCommissionAmount(rule, context);

      const calcDetails = buildCalcDetails(rule, deal, recruiterSnapshot, amount, {
        overrideLevel: level,
        setterSnapshot,
      });

      await db.insert(commissions).values({
        dealId: deal.id,
        personId: currentPersonId,
        commissionType: `override_recruited_by_l${level}` as any,
        amount: amount.toString(),
        commissionRuleId: rule.id,
        payPlanId: payPlanData.payPlan.id,
        calcDetails,
        status: "pending",
      });

      count++;
    }

    // Move up the chain
    currentPersonId = recruiterSnapshot.recruitedById || null;
    level++;
  }

  return count;
}

/** office_hierarchy override_level: 1 AD, 2 Regional, 3 Divisional, 4 VP */
const OFFICE_ROLE_LEVEL: Record<string, number> = {
  ad: 1,
  regional: 2,
  divisional: 3,
  vp: 4,
};

const OFFICE_COMMISSION_TYPE: Record<string, "override_office_ad" | "override_office_regional" | "override_office_divisional" | "override_office_vp"> = {
  ad: "override_office_ad",
  regional: "override_office_regional",
  divisional: "override_office_divisional",
  vp: "override_office_vp",
};

/**
 * Calculate office-hierarchy overrides: AD/Regional/Divisional/VP for the deal's office.
 * Only assignments effective on the deal's close date qualify (no retroactivity).
 */
async function calculateOfficeHierarchyOverrides(
  deal: Deal,
  effectiveDate: string
): Promise<number> {
  if (!deal.officeId) {
    return 0;
  }

  const [officeRow] = await db
    .select()
    .from(offices)
    .where(eq(offices.id, deal.officeId))
    .limit(1);

  if (!officeRow) {
    return 0;
  }

  const dateFilter = and(
    lte(officeLeadership.effectiveFrom, effectiveDate),
    or(isNull(officeLeadership.effectiveTo), gte(officeLeadership.effectiveTo, effectiveDate))
  );

  // AD: this office
  const adRows = await db
    .select()
    .from(officeLeadership)
    .where(
      and(
        eq(officeLeadership.officeId, deal.officeId),
        eq(officeLeadership.roleType, "ad"),
        dateFilter
      )
    );

  // Regional: this office's region
  const regionalRows =
    officeRow.region != null
      ? await db
          .select()
          .from(officeLeadership)
          .where(
            and(
              eq(officeLeadership.region, officeRow.region),
              eq(officeLeadership.roleType, "regional"),
              dateFilter
            )
          )
      : [];

  // Divisional: this office's division
  const divisionalRows =
    officeRow.division != null
      ? await db
          .select()
          .from(officeLeadership)
          .where(
            and(
              eq(officeLeadership.division, officeRow.division),
              eq(officeLeadership.roleType, "divisional"),
              dateFilter
            )
          )
      : [];

  // VP: one per deal — prefer divisional VP for this office's division, else company-wide VP
  let vpRows: { personId: string; roleType: "vp"; effectiveFrom: string | null; effectiveTo: string | null }[] = [];
  if (officeRow.division != null) {
    const divVp = await db
      .select()
      .from(officeLeadership)
      .where(
        and(
          eq(officeLeadership.roleType, "vp"),
          eq(officeLeadership.division, officeRow.division),
          dateFilter
        )
      )
      .limit(1);
    if (divVp.length > 0) {
      vpRows = divVp.map((r) => ({ personId: r.personId, roleType: "vp" as const, effectiveFrom: r.effectiveFrom, effectiveTo: r.effectiveTo }));
    }
  }
  if (vpRows.length === 0) {
    const companyVp = await db
      .select()
      .from(officeLeadership)
      .where(
        and(
          eq(officeLeadership.roleType, "vp"),
          isNull(officeLeadership.division),
          dateFilter
        )
      )
      .limit(1);
    vpRows = companyVp.map((r) => ({ personId: r.personId, roleType: "vp" as const, effectiveFrom: r.effectiveFrom, effectiveTo: r.effectiveTo }));
  }

  const allLeaders = [
    ...adRows.map((r) => ({ ...r, roleType: "ad" as const })),
    ...regionalRows.map((r) => ({ ...r, roleType: "regional" as const })),
    ...divisionalRows.map((r) => ({ ...r, roleType: "divisional" as const })),
    ...vpRows.map((r) => ({ ...r, roleType: "vp" as const })),
  ];

  let count = 0;
  const setterSnapshot = await getOrCreateOrgSnapshot(deal.setterId, effectiveDate);

  for (const row of allLeaders) {
    const payPlanData = await getPersonCurrentPayPlan(row.personId, effectiveDate);
    if (!payPlanData) continue;

    const rules = await getRulesForPayPlan(payPlanData.payPlan.id, "override");
    const level = OFFICE_ROLE_LEVEL[row.roleType];
    const commissionType = OFFICE_COMMISSION_TYPE[row.roleType];

    const context: RuleEvaluationContext = {
      dealType: deal.dealType,
      systemSizeKw: parseFloat(deal.systemSizeKw || "0"),
      dealValue: parseFloat(deal.dealValue),
      ppw: parseFloat(deal.ppw || "0"),
      setterTier: (setterSnapshot.setterTier as "Rookie" | "Veteran" | "Team Lead" | null) || null,
      personRoleId: "", // leader's role not required for office-hierarchy rule match
    };

    const leaderSnapshot = await getOrCreateOrgSnapshot(row.personId, effectiveDate);

    const applicableRules = rules.filter((rule) => {
      if (rule.overrideSource !== "office_hierarchy") return false;
      if (rule.overrideLevel !== null && rule.overrideLevel !== 0 && rule.overrideLevel !== level) {
        return false;
      }
      return evaluateRule(rule, context);
    });

    if (applicableRules.length === 0) continue;

    const rule = applicableRules[0];
    const amount = calculateCommissionAmount(rule, context);
    const calcDetails = buildCalcDetails(rule, deal, leaderSnapshot, amount, {
      overrideLevel: level,
      setterSnapshot,
    });

    await db.insert(commissions).values({
      dealId: deal.id,
      personId: row.personId,
      commissionType,
      amount: amount.toString(),
      commissionRuleId: rule.id,
      payPlanId: payPlanData.payPlan.id,
      calcDetails,
      status: "pending",
    });
    count++;
  }

  return count;
}

/**
 * Build the calc_details JSONB object for audit trail.
 */
function buildCalcDetails(
  rule: CommissionRule,
  deal: Deal,
  snapshot: OrgSnapshot,
  amount: number,
  additionalData?: {
    overrideLevel?: number;
    setterSnapshot?: OrgSnapshot;
  }
): Record<string, any> {
  const formula = buildFormula(rule, deal);

  return {
    formula,
    result: amount,
    pay_plan: {
      id: snapshot.payPlanId,
      name: snapshot.payPlanName,
    },
    commission_rule: {
      id: rule.id,
      name: rule.name,
      rule_type: rule.ruleType,
      calc_method: rule.calcMethod,
      amount: rule.amount,
    },
    org_snapshot_id: snapshot.id,
    setter_tier: additionalData?.setterSnapshot?.setterTier || snapshot.setterTier,
    deal: {
      id: deal.id,
      deal_type: deal.dealType,
      deal_value: parseFloat(deal.dealValue),
      system_size_kw: deal.systemSizeKw ? parseFloat(deal.systemSizeKw) : null,
      ppw: deal.ppw ? parseFloat(deal.ppw) : null,
    },
    charges: 0, // Placeholder for future deductions
    adders: 0, // Placeholder for future bonuses
    ...(additionalData?.overrideLevel && { override_level: additionalData.overrideLevel }),
  };
}

/**
 * Build a human-readable formula string.
 */
function buildFormula(rule: CommissionRule, deal: Deal): string {
  const amount = parseFloat(rule.amount);

  switch (rule.calcMethod) {
    case "flat_per_kw":
      const kw = parseFloat(deal.systemSizeKw || "0");
      return `$${amount}/kW × ${kw} kW = $${(amount * kw).toFixed(2)}`;

    case "percentage_of_deal":
      const dealValue = parseFloat(deal.dealValue);
      return `${amount}% × $${dealValue.toFixed(2)} = $${((amount / 100) * dealValue).toFixed(2)}`;

    case "flat_fee":
      return `$${amount.toFixed(2)}`;

    default:
      return `Unknown calculation method: ${rule.calcMethod}`;
  }
}
