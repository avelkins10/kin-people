import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { regions } from './regions';

export const repcardRegionMappings = pgTable(
  'repcard_region_mappings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    regionId: uuid('region_id').references(() => regions.id, { onDelete: 'cascade' }).notNull(),
    repcardOffice: varchar('repcard_office', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxRepcardRegionId: uniqueIndex('idx_repcard_region_id').on(table.regionId),
  })
);

export type RepcardRegionMapping = typeof repcardRegionMappings.$inferSelect;
export type NewRepcardRegionMapping = typeof repcardRegionMappings.$inferInsert;
