import { pgTable, uuid, varchar, text, date, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { roles } from './roles';
import { offices } from './offices';

/**
 * People table stores all reps, managers, and team members.
 * 
 * setter_tier values:
 * - 'Rookie': New setter, typically lower override rates
 * - 'Veteran': Experienced setter, standard override rates
 * - 'Team Lead': Team lead setter, may have additional override benefits
 * 
 * status values:
 * - 'onboarding': Newly hired, not yet active
 * - 'active': Currently active
 * - 'inactive': Temporarily inactive
 * - 'terminated': No longer with company
 */
export const people = pgTable(
  'people',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // KIN ID - stable identifier throughout career
    kinId: varchar('kin_id', { length: 12 }).unique(),
    // Basic info
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    normalizedPhone: varchar('normalized_phone', { length: 20 }), // For duplicate detection
    profileImageUrl: text('profile_image_url'),
    // Current state
    roleId: uuid('role_id').references(() => roles.id).notNull(),
    status: varchar('status', { length: 50 }).default('active'), // 'onboarding', 'active', 'inactive', 'terminated'
    officeId: uuid('office_id').references(() => offices.id),
    recruitedById: uuid('recruited_by_id').references((): AnyPgColumn => people.id), // Self-reference
    reportsToId: uuid('reports_to_id').references((): AnyPgColumn => people.id), // Self-reference
    // Setter tier
    setterTier: varchar('setter_tier', { length: 50 }), // 'Rookie', 'Veteran', 'Team Lead'
    // Dates
    hireDate: date('hire_date'),
    terminationDate: date('termination_date'),
    // External IDs
    quickbaseId: varchar('quickbase_id', { length: 100 }),
    authUserId: uuid('auth_user_id'), // Supabase Auth user ID (UUID)
    // Metadata
    metadata: jsonb('metadata').default('{}'),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxPeopleRole: index('idx_people_role').on(table.roleId),
    idxPeopleStatus: index('idx_people_status').on(table.status),
    idxPeopleOffice: index('idx_people_office').on(table.officeId),
    idxPeopleRecruitedBy: index('idx_people_recruited_by').on(table.recruitedById),
    idxPeopleReportsTo: index('idx_people_reports_to').on(table.reportsToId),
    idxPeopleQuickbase: index('idx_people_quickbase').on(table.quickbaseId),
    idxPeopleAuthUser: index('idx_people_auth_user').on(table.authUserId),
    idxPeopleEmail: index('idx_people_email').on(table.email),
    idxPeopleKinId: index('idx_people_kin_id').on(table.kinId),
  })
);

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
