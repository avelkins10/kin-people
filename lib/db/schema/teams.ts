import { pgTable, uuid, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { offices } from './offices';
import { people } from './people';

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    officeId: uuid('office_id').references(() => offices.id),
    teamLeadId: uuid('team_lead_id').references(() => people.id),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxTeamsActive: index('idx_teams_active').on(table.isActive),
    idxTeamsOffice: index('idx_teams_office').on(table.officeId),
    idxTeamsLead: index('idx_teams_lead').on(table.teamLeadId),
  })
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
