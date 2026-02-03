import { pgTable, uuid, varchar, text, integer, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const documentTemplates = pgTable(
  'document_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentType: varchar('document_type', { length: 50 }).notNull().unique(),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    signnowTemplateId: varchar('signnow_template_id', { length: 100 }),
    requireRecruit: boolean('require_recruit').default(true),
    requireManager: boolean('require_manager').default(false),
    requireHR: boolean('require_hr').default(false),
    expirationDays: integer('expiration_days').default(30),
    reminderFrequencyDays: integer('reminder_frequency_days').default(3),
    description: text('description'),
    metadata: jsonb('metadata').default('{}'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxDocumentTemplatesType: index('idx_document_templates_type').on(table.documentType),
    idxDocumentTemplatesActive: index('idx_document_templates_active').on(table.isActive),
  })
);

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type NewDocumentTemplate = typeof documentTemplates.$inferInsert;
