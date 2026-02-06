import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { people } from './people';

export const repcardAccounts = pgTable(
  'repcard_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personId: uuid('person_id').references(() => people.id, { onDelete: 'cascade' }).notNull(),
    repcardUserId: varchar('repcard_user_id', { length: 50 }),
    repcardUsername: varchar('repcard_username', { length: 100 }),
    jobTitle: varchar('job_title', { length: 100 }),
    repcardRole: varchar('repcard_role', { length: 50 }),
    repcardOffice: varchar('repcard_office', { length: 100 }),
    repcardTeam: varchar('repcard_team', { length: 100 }),
    status: varchar('status', { length: 20 }).default('active').notNull(), // 'active' | 'deactivated' | 'error' | 'pending'
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    lastSyncError: varchar('last_sync_error', { length: 500 }),
    createdBy: uuid('created_by').references(() => people.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxRepcardPersonId: uniqueIndex('idx_repcard_person_id').on(table.personId),
    idxRepcardUserId: uniqueIndex('idx_repcard_user_id').on(table.repcardUserId),
    idxRepcardStatus: index('idx_repcard_status').on(table.status),
  })
);

export type RepcardAccount = typeof repcardAccounts.$inferSelect;
export type NewRepcardAccount = typeof repcardAccounts.$inferInsert;
