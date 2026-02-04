import { sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index, check } from 'drizzle-orm/pg-core';
import { recruits } from './recruits';
import { people } from './people';

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recruitId: uuid('recruit_id').references(() => recruits.id),
    personId: uuid('person_id').references(() => people.id),
    documentType: varchar('document_type', { length: 50 }).notNull(),
    signnowDocumentId: varchar('signnow_document_id', { length: 100 }),
    signnowTemplateId: varchar('signnow_template_id', { length: 100 }),
    status: varchar('status', { length: 50 }).default('pending'),
    totalSigners: integer('total_signers').default(1),
    signedCount: integer('signed_count').default(0),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }),
    signedAt: timestamp('signed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    declinedAt: timestamp('declined_at', { withTimezone: true }),
    declinedBy: varchar('declined_by', { length: 255 }), // email of signer who declined
    declineReason: text('decline_reason'),
    deliveryFailedAt: timestamp('delivery_failed_at', { withTimezone: true }),
    deliveryFailedEmail: varchar('delivery_failed_email', { length: 255 }),
    storagePath: text('storage_path'),
    storageUrl: text('storage_url'),
    metadata: jsonb('metadata').default('{}'),
    createdById: uuid('created_by_id').references(() => people.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    documentsOwnerCheck: check(
      'documents_owner_check',
      sql`(${table.recruitId} IS NOT NULL OR ${table.personId} IS NOT NULL)`
    ),
    idxDocumentsRecruit: index('idx_documents_recruit').on(table.recruitId),
    idxDocumentsPerson: index('idx_documents_person').on(table.personId),
    idxDocumentsStatus: index('idx_documents_status').on(table.status),
    idxDocumentsSignnow: index('idx_documents_signnow').on(table.signnowDocumentId),
    idxDocumentsExpires: index('idx_documents_expires').on(table.expiresAt),
    idxDocumentsType: index('idx_documents_type').on(table.documentType),
  })
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
