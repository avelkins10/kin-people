import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { offices } from './offices';

export const repcardOfficeMappings = pgTable(
  'repcard_office_mappings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    officeId: uuid('office_id').references(() => offices.id, { onDelete: 'cascade' }).notNull(),
    repcardOffice: varchar('repcard_office', { length: 100 }).notNull(),
    repcardTeam: varchar('repcard_team', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxRepcardOfficeMappingOfficeId: uniqueIndex('idx_repcard_office_mapping_office_id').on(table.officeId),
  })
);

export type RepcardOfficeMapping = typeof repcardOfficeMappings.$inferSelect;
export type NewRepcardOfficeMapping = typeof repcardOfficeMappings.$inferInsert;
