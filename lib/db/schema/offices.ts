import { pgTable, uuid, varchar, text, boolean, timestamptz, index } from 'drizzle-orm/pg-core';

export const offices = pgTable(
  'offices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    region: varchar('region', { length: 100 }),
    states: text('states').array(),
    address: text('address'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamptz('created_at').defaultNow(),
    updatedAt: timestamptz('updated_at').defaultNow(),
  },
  (table) => ({
    idxOfficesActive: index('idx_offices_active').on(table.isActive),
    idxOfficesRegion: index('idx_offices_region').on(table.region),
  })
);

export type Office = typeof offices.$inferSelect;
export type NewOffice = typeof offices.$inferInsert;
