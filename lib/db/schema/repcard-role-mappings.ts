import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { roles } from './roles';

export const repcardRoleMappings = pgTable(
  'repcard_role_mappings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
    repcardRole: varchar('repcard_role', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxRepcardRoleMappingRoleId: uniqueIndex('idx_repcard_role_mapping_role_id').on(table.roleId),
  })
);

export type RepcardRoleMapping = typeof repcardRoleMappings.$inferSelect;
export type NewRepcardRoleMapping = typeof repcardRoleMappings.$inferInsert;
