import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { people } from './people';
import { offices } from './offices';
import { teams } from './teams';
import { roles } from './roles';
import { payPlans } from './pay-plans';

export const recruits = pgTable(
  'recruits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Basic info
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    // Pipeline
    status: varchar('status', { length: 50 }).default('lead'), // 'lead', 'contacted', 'interviewing', 'offer_sent', 'agreement_sent', 'agreement_signed', 'onboarding', 'converted', 'rejected', 'dropped'
    source: varchar('source', { length: 100 }), // where they came from
    // Assignments
    recruiterId: uuid('recruiter_id').references(() => people.id).notNull(),
    targetOfficeId: uuid('target_office_id').references(() => offices.id),
    targetTeamId: uuid('target_team_id').references(() => teams.id),
    targetReportsToId: uuid('target_reports_to_id').references(() => people.id),
    targetRoleId: uuid('target_role_id').references(() => roles.id),
    targetPayPlanId: uuid('target_pay_plan_id').references(() => payPlans.id),
    // Agreement tracking
    signnowDocumentId: varchar('signnow_document_id', { length: 100 }),
    agreementSentAt: timestamp('agreement_sent_at', { withTimezone: true }),
    agreementSignedAt: timestamp('agreement_signed_at', { withTimezone: true }),
    agreementDocumentUrl: text('agreement_document_url'),
    // Conversion
    convertedToPersonId: uuid('converted_to_person_id').references(() => people.id),
    convertedAt: timestamp('converted_at', { withTimezone: true }),
    // Notes
    notes: text('notes'),
    metadata: jsonb('metadata').default('{}'),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxRecruitsStatus: index('idx_recruits_status').on(table.status),
    idxRecruitsRecruiter: index('idx_recruits_recruiter').on(table.recruiterId),
    idxRecruitsEmail: index('idx_recruits_email').on(table.email),
  })
);

export type Recruit = typeof recruits.$inferSelect;
export type NewRecruit = typeof recruits.$inferInsert;
