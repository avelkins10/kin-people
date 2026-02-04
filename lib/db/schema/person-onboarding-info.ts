import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { people } from './people';
import { onboardingInfoFields } from './onboarding-info-fields';

/**
 * Table for storing collected personal info for each new hire.
 * Links people to their submitted info field values.
 */
export const personOnboardingInfo = pgTable('person_onboarding_info', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id').notNull().references(() => onboardingInfoFields.id, { onDelete: 'cascade' }),
  fieldValue: text('field_value'), // The submitted value
  submittedAt: timestamp('submitted_at', { withTimezone: true }), // When the value was submitted
  verifiedBy: uuid('verified_by').references(() => people.id, { onDelete: 'set null' }), // Who verified
  verifiedAt: timestamp('verified_at', { withTimezone: true }), // When verified
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniquePersonField: unique().on(table.personId, table.fieldId),
}));

export type PersonOnboardingInfo = typeof personOnboardingInfo.$inferSelect;
export type NewPersonOnboardingInfo = typeof personOnboardingInfo.$inferInsert;
