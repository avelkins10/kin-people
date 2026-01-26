import { pgTable, uuid, varchar, integer, text, jsonb, boolean, timestamptz, index } from 'drizzle-orm/pg-core';

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    level: integer('level').notNull(), // hierarchy level (1 = lowest)
    description: text('description'),
    permissions: jsonb('permissions').default('{}'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamptz('created_at').defaultNow(),
    updatedAt: timestamptz('updated_at').defaultNow(),
  },
  (table) => ({
    idxRolesActive: index('idx_roles_active').on(table.isActive),
    idxRolesLevel: index('idx_roles_level').on(table.level),
  })
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
