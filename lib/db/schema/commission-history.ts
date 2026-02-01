import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { commissions } from './commissions';
import { people } from './people';

export const commissionHistory = pgTable('commission_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  commissionId: uuid('commission_id').references(() => commissions.id).notNull(),
  previousStatus: varchar('previous_status', { length: 50 }),
  newStatus: varchar('new_status', { length: 50 }).notNull(),
  reason: text('reason'),
  changedById: uuid('changed_by_id').references(() => people.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type CommissionHistory = typeof commissionHistory.$inferSelect;
export type NewCommissionHistory = typeof commissionHistory.$inferInsert;
