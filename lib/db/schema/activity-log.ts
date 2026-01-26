import { pgTable, uuid, varchar, jsonb, timestamptz, index } from 'drizzle-orm/pg-core';
import { people } from './people';

export const activityLog = pgTable(
  'activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // What
    entityType: varchar('entity_type', { length: 50 }).notNull(), // 'person', 'deal', 'commission', 'recruit', 'office', 'team', 'pay_plan', 'role'
    entityId: uuid('entity_id').notNull(),
    action: varchar('action', { length: 50 }).notNull(), // 'created', 'updated', 'deleted', 'status_changed', 'commission_calculated', etc.
    // Details
    details: jsonb('details'),
    // Who
    actorId: uuid('actor_id').references(() => people.id),
    actorType: varchar('actor_type', { length: 50 }).default('user'), // 'user', 'system', 'webhook'
    // Timestamp
    createdAt: timestamptz('created_at').defaultNow(),
  },
  (table) => ({
    idxActivityEntity: index('idx_activity_entity').on(table.entityType, table.entityId),
    idxActivityActor: index('idx_activity_actor').on(table.actorId),
    idxActivityCreated: index('idx_activity_created').on(table.createdAt),
  })
);

export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
