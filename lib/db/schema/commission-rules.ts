import { pgTable, uuid, varchar, text, decimal, integer, jsonb, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { payPlans } from './pay-plans';
import { roles } from './roles';

/**
 * Commission rules define how commissions are calculated within a pay plan.
 * 
 * rule_type values:
 * - 'base_commission': Base commission for the rep on their own deal
 * - 'setter_commission': Commission for the setter on a deal
 * - 'closer_commission': Commission for the closer on a deal
 * - 'self_gen_commission': Commission when setter and closer are the same person
 * - 'override': Override commission for managers/recruiters (reports_to, recruited_by, or office_hierarchy)
 * - 'recruiting_bonus': One-time bonus for bringing someone in
 * - 'draw': Advance against future commissions
 *
 * override_source values (when rule_type = 'override'):
 * - 'reports_to': Override via setter's reports_to chain; override_level = 1 = direct, 2 = skip-level, etc.
 * - 'recruited_by': Override via setter's recruited_by chain; override_level = 1, 2, etc.
 * - 'office_hierarchy': Override via office/region/division leadership; override_level = 1 AD, 2 Regional, 3 Divisional, 4 VP.
 *
 * calc_method values:
 * - 'flat_per_kw': Fixed amount per kW (for solar deals)
 * - 'percentage_of_deal': Percentage of deal value
 * - 'flat_fee': Fixed dollar amount
 * 
 * conditions JSONB structure:
 * - Can include setter_tier matching: { setter_tier: 'Rookie' | 'Veteran' | 'Team Lead' }
 * - Can include thresholds: { min_kw: number, ppw_floor: number }
 * - Can include deal type filters: { deal_types: string[] }
 */
export const commissionRules = pgTable(
  'commission_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    payPlanId: uuid('pay_plan_id').references(() => payPlans.id).notNull(),
    name: varchar('name', { length: 100 }),
    ruleType: varchar('rule_type', { length: 50 }).notNull(), // 'base_commission', 'setter_commission', 'closer_commission', 'self_gen_commission', 'override', 'recruiting_bonus', 'draw'
    calcMethod: varchar('calc_method', { length: 50 }).notNull(), // 'flat_per_kw', 'percentage_of_deal', 'flat_fee'
    amount: decimal('amount', { precision: 10, scale: 4 }).notNull(),
    appliesToRoleId: uuid('applies_to_role_id').references(() => roles.id),
    overrideLevel: integer('override_level'), // 1 = direct, 2 = skip-level, etc.
    overrideSource: varchar('override_source', { length: 50 }), // 'reports_to' | 'recruited_by' | 'office_hierarchy'
    dealTypes: text('deal_types').array(), // ['solar', 'hvac', 'roofing'], null = all
    conditions: jsonb('conditions').default('{}'), // Flexible conditions including setter_tier matching
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxCommissionRulesPayPlan: index('idx_commission_rules_pay_plan').on(table.payPlanId),
    idxCommissionRulesActive: index('idx_commission_rules_active').on(table.isActive),
  })
);

export type CommissionRule = typeof commissionRules.$inferSelect;
export type NewCommissionRule = typeof commissionRules.$inferInsert;
