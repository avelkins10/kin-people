import { pgTable, uuid, varchar, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const offices = pgTable(
  'offices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    region: varchar('region', { length: 100 }),
    states: text('states').array(),
    address: text('address'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxOfficesActive: index('idx_offices_active').on(table.isActive),
    idxOfficesRegion: index('idx_offices_region').on(table.region),
    officesNameUnique: uniqueIndex('offices_name_unique').on(table.name),
  })
);

export type Office = typeof offices.$inferSelect;
export type NewOffice = typeof offices.$inferInsert;
