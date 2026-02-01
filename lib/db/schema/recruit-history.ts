import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { recruits } from './recruits';
import { people } from './people';

export const recruitHistory = pgTable('recruit_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  recruitId: uuid('recruit_id').references(() => recruits.id).notNull(),
  previousStatus: varchar('previous_status', { length: 50 }),
  newStatus: varchar('new_status', { length: 50 }).notNull(),
  notes: text('notes'),
  changedById: uuid('changed_by_id').references(() => people.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type RecruitHistory = typeof recruitHistory.$inferSelect;
export type NewRecruitHistory = typeof recruitHistory.$inferInsert;
