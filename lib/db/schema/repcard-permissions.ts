import { pgTable, uuid, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { roles } from './roles';

export const repcardPermissions = pgTable(
  'repcard_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
    canCreate: boolean('can_create').default(false).notNull(),
    canEdit: boolean('can_edit').default(false).notNull(),
    canDeactivate: boolean('can_deactivate').default(false).notNull(),
    canLink: boolean('can_link').default(false).notNull(),
    canSync: boolean('can_sync').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxRepcardPermissionsRoleId: uniqueIndex('idx_repcard_permissions_role_id').on(table.roleId),
  })
);

export type RepcardPermission = typeof repcardPermissions.$inferSelect;
export type NewRepcardPermission = typeof repcardPermissions.$inferInsert;
