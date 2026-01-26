import { pgTable, uuid, varchar, date, timestamptz, index, unique } from 'drizzle-orm/pg-core';
import { people } from './people';
import { roles } from './roles';
import { offices } from './offices';
import { payPlans } from './pay-plans';

/**
 * Org snapshots capture the complete organizational state at a point in time.
 * Used for accurate historical commission calculations.
 * 
 * This table stores denormalized data to ensure commission calculations
 * always reference the correct historical state, even if org structure changes later.
 * 
 * setter_tier is included to support tier-based override calculations.
 * 
 * Unique constraint on (person_id, snapshot_date) prevents duplicate snapshots.
 */
export const orgSnapshots = pgTable(
  'org_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personId: uuid('person_id').references(() => people.id).notNull(),
    snapshotDate: date('snapshot_date').notNull(),
    // Org state at this date
    roleId: uuid('role_id').references(() => roles.id),
    roleName: varchar('role_name', { length: 100 }),
    officeId: uuid('office_id').references(() => offices.id),
    officeName: varchar('office_name', { length: 100 }),
    reportsToId: uuid('reports_to_id').references(() => people.id),
    reportsToName: varchar('reports_to_name', { length: 200 }),
    recruitedById: uuid('recruited_by_id').references(() => people.id),
    recruitedByName: varchar('recruited_by_name', { length: 200 }),
    payPlanId: uuid('pay_plan_id').references(() => payPlans.id),
    payPlanName: varchar('pay_plan_name', { length: 100 }),
    // Setter tier
    setterTier: varchar('setter_tier', { length: 50 }), // 'Rookie', 'Veteran', 'Team Lead'
    // Teams
    teamIds: uuid('team_ids').array(),
    teamNames: varchar('team_names', { length: 255 }).array(),
    // Timestamp
    createdAt: timestamptz('created_at').defaultNow(),
  },
  (table) => ({
    idxOrgSnapshotsPerson: index('idx_org_snapshots_person').on(table.personId),
    idxOrgSnapshotsDate: index('idx_org_snapshots_date').on(table.snapshotDate),
    idxOrgSnapshotsPersonDate: index('idx_org_snapshots_person_date').on(table.personId, table.snapshotDate),
    uniquePersonSnapshot: unique('org_snapshots_person_id_snapshot_date_unique').on(table.personId, table.snapshotDate),
  })
);

export type OrgSnapshot = typeof orgSnapshots.$inferSelect;
export type NewOrgSnapshot = typeof orgSnapshots.$inferInsert;
