import { pgTable, uuid, varchar, decimal, date, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { deals } from './deals';
import { people } from './people';
import { commissionRules } from './commission-rules';
import { payPlans } from './pay-plans';

/**
 * Commissions table stores calculated commission records.
 * 
 * commission_type values:
 * - 'setter': Commission for the setter
 * - 'closer': Commission for the closer
 * - 'self_gen': Commission when setter and closer are the same
 * - 'override_reports_to_l1': First level override via reports_to chain
 * - 'override_reports_to_l2': Second level override via reports_to chain
 * - 'override_recruited_by_l1': First level override via recruited_by chain
 * - 'override_recruited_by_l2': Second level override via recruited_by chain
 * - 'override_office_ad': Override for office AD (office_hierarchy level 1)
 * - 'override_office_regional': Override for Regional (office_hierarchy level 2)
 * - 'override_office_divisional': Override for Divisional (office_hierarchy level 3)
 * - 'override_office_vp': Override for VP (office_hierarchy level 4)
 * - etc.
 * 
 * calc_details JSONB structure:
 * {
 *   formula: string, // e.g., "flat_per_kw * system_size_kw"
 *   result: number,
 *   pay_plan: { id, name },
 *   commission_rule: { id, name, rule_type, calc_method, amount },
 *   org_snapshot_id: uuid,
 *   setter_tier: string,
 *   deal: { id, deal_type, deal_value, system_size_kw, ppw },
 *   charges: number, // deductions
 *   adders: number // bonuses
 * }
 */
export const commissions = pgTable(
  'commissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Links
    dealId: uuid('deal_id').references(() => deals.id).notNull(),
    personId: uuid('person_id').references(() => people.id).notNull(),
    // Commission details
    commissionType: varchar('commission_type', { length: 50 }).notNull(), // 'setter', 'closer', 'self_gen', 'override_reports_to_l1', etc.
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    // Calculation audit trail
    commissionRuleId: uuid('commission_rule_id').references(() => commissionRules.id),
    payPlanId: uuid('pay_plan_id').references(() => payPlans.id),
    calcDetails: jsonb('calc_details').notNull(), // Full breakdown of calculation
    // Status
    status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'approved', 'paid', 'held', 'void'
    statusReason: text('status_reason'), // reason for hold/void
    // Payroll
    payPeriodDate: date('pay_period_date'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    // Notes
    notes: text('notes'),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxCommissionsDeal: index('idx_commissions_deal').on(table.dealId),
    idxCommissionsPerson: index('idx_commissions_person').on(table.personId),
    idxCommissionsStatus: index('idx_commissions_status').on(table.status),
    idxCommissionsType: index('idx_commissions_type').on(table.commissionType),
    idxCommissionsPayPeriod: index('idx_commissions_pay_period').on(table.payPeriodDate),
    idxCommissionsPersonStatus: index('idx_commissions_person_status').on(table.personId, table.status),
  })
);

export type Commission = typeof commissions.$inferSelect;
export type NewCommission = typeof commissions.$inferInsert;
