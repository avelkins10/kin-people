import { pgTable, uuid, varchar, text, boolean, timestamptz } from 'drizzle-orm/pg-core';

export const payPlans = pgTable('pay_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

export type PayPlan = typeof payPlans.$inferSelect;
export type NewPayPlan = typeof payPlans.$inferInsert;
