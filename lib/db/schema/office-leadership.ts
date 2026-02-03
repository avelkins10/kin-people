import {
  pgTable,
  uuid,
  varchar,
  date,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { offices } from './offices';
import { people } from './people';

/**
 * Office leadership assignments: who gets overrides on deals in an office/region/division.
 *
 * role_type values:
 * - 'ad': Area Director — one per office (mandatory). office_id set, region/division null.
 * - 'regional': Regional — one per region. region set, office_id/division null.
 * - 'divisional': Divisional — one per division. division set, office_id/region null.
 * - 'vp': VP — one per division or company-wide. division set or null.
 *
 * Uniqueness (one AD per office, one Regional per region, etc.) is enforced in the API.
 *
 * Overrides apply only for deals with close_date >= effective_from and (effective_to is null or close_date <= effective_to).
 */
export const officeLeadership = pgTable(
  'office_leadership',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    officeId: uuid('office_id').references(() => offices.id),
    region: varchar('region', { length: 100 }),
    division: varchar('division', { length: 100 }),
    roleType: varchar('role_type', { length: 50 }).notNull(), // 'ad' | 'regional' | 'divisional' | 'vp'
    personId: uuid('person_id')
      .references(() => people.id, { onDelete: 'cascade' })
      .notNull(),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxOfficeLeadershipOffice: index('idx_office_leadership_office').on(
      table.officeId
    ),
    idxOfficeLeadershipRegion: index('idx_office_leadership_region').on(
      table.region
    ),
    idxOfficeLeadershipDivision: index('idx_office_leadership_division').on(
      table.division
    ),
    idxOfficeLeadershipPerson: index('idx_office_leadership_person').on(
      table.personId
    ),
    idxOfficeLeadershipDates: index('idx_office_leadership_dates').on(
      table.effectiveFrom,
      table.effectiveTo
    ),
  })
);

export type OfficeLeadership = typeof officeLeadership.$inferSelect;
export type NewOfficeLeadership = typeof officeLeadership.$inferInsert;
