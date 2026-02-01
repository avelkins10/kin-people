import { pgTable, uuid, varchar, date, timestamp, index } from 'drizzle-orm/pg-core';
import { people } from './people';
import { teams } from './teams';

export const personTeams = pgTable(
  'person_teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personId: uuid('person_id').references(() => people.id).notNull(),
    teamId: uuid('team_id').references(() => teams.id).notNull(),
    roleInTeam: varchar('role_in_team', { length: 50 }).default('member'), // 'member', 'lead', 'co-lead'
    effectiveDate: date('effective_date').notNull(),
    endDate: date('end_date'), // null if current
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxPersonTeamsPerson: index('idx_person_teams_person').on(table.personId),
    idxPersonTeamsTeam: index('idx_person_teams_team').on(table.teamId),
    // Partial index for active team memberships - will be added back when database is set up
    // idxPersonTeamsActive: index('idx_person_teams_active').on(table.personId).where(sql`${table.endDate} IS NULL`),
  })
);

export type PersonTeam = typeof personTeams.$inferSelect;
export type NewPersonTeam = typeof personTeams.$inferInsert;
