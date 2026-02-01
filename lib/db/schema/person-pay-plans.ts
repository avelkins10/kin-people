import { pgTable, uuid, date, text, timestamp, index } from 'drizzle-orm/pg-core';
import { people } from './people';
import { payPlans } from './pay-plans';

export const personPayPlans = pgTable(
  'person_pay_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personId: uuid('person_id').references(() => people.id).notNull(),
    payPlanId: uuid('pay_plan_id').references(() => payPlans.id).notNull(),
    effectiveDate: date('effective_date').notNull(),
    endDate: date('end_date'), // null if current
    notes: text('notes'), // for special deal documentation
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxPersonPayPlansPerson: index('idx_person_pay_plans_person').on(table.personId),
    // Partial index for active pay plans - will be added back when database is set up
    // idxPersonPayPlansActive: index('idx_person_pay_plans_active').on(table.personId).where(sql`${table.endDate} IS NULL`),
  })
);

export type PersonPayPlan = typeof personPayPlans.$inferSelect;
export type NewPersonPayPlan = typeof personPayPlans.$inferInsert;
