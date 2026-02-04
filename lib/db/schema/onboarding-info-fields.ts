import { pgTable, uuid, varchar, boolean, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

/**
 * Field types for personal info collection:
 * - text: Free text input
 * - select: Dropdown selection
 * - date: Date picker
 * - phone: Phone number input
 * - address: Address input (may expand to multiple fields)
 * - email: Email input
 * - number: Numeric input
 */
export const INFO_FIELD_TYPES = ['text', 'select', 'date', 'phone', 'address', 'email', 'number'] as const;
export type InfoFieldType = typeof INFO_FIELD_TYPES[number];

/**
 * Categories for grouping personal info fields:
 * - uniform: Clothing sizes
 * - emergency: Emergency contact info
 * - personal: Personal details
 * - tax: Tax-related info
 * - benefits: Benefits enrollment info
 */
export const INFO_FIELD_CATEGORIES = ['uniform', 'emergency', 'personal', 'tax', 'benefits'] as const;
export type InfoFieldCategory = typeof INFO_FIELD_CATEGORIES[number];

/**
 * Options for select-type fields
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Table for defining what personal info fields to collect from new hires.
 * Admins configure these in Settings - no default fields are seeded.
 */
export const onboardingInfoFields = pgTable('onboarding_info_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  fieldName: varchar('field_name', { length: 100 }).notNull(), // Unique identifier (e.g., shirt_size)
  fieldLabel: varchar('field_label', { length: 255 }).notNull(), // Display label (e.g., Shirt Size)
  fieldType: varchar('field_type', { length: 50 }).notNull(), // text, select, date, phone, address, email, number
  fieldOptions: jsonb('field_options').$type<SelectOption[]>(), // For select type: [{value, label}]
  isRequired: boolean('is_required').default(false),
  category: varchar('category', { length: 50 }), // uniform, emergency, personal, tax, benefits
  displayOrder: integer('display_order').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type OnboardingInfoField = typeof onboardingInfoFields.$inferSelect;
export type NewOnboardingInfoField = typeof onboardingInfoFields.$inferInsert;
