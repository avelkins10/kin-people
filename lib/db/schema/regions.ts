import { pgTable, uuid, varchar, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { divisions } from './divisions';

/**
 * Regions table - normalizes the varchar region values from offices/office_leadership.
 *
 * Hierarchy:
 * Division → Region
 *     └── Area Director → Office
 *         └── Team Lead → Team
 *             └── Sales Reps
 */
export const regions = pgTable(
  'regions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 255 }),
    divisionId: uuid('division_id').references(() => divisions.id),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxRegionsActive: index('idx_regions_active').on(table.isActive),
    idxRegionsDivision: index('idx_regions_division').on(table.divisionId),
    regionsNameUnique: uniqueIndex('regions_name_unique').on(table.name),
  })
);

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;
