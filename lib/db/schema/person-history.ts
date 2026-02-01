import { pgTable, uuid, varchar, jsonb, date, text, timestamp, index } from 'drizzle-orm/pg-core';
import { people } from './people';

/**
 * Person history tracks all changes to a person's record.
 * 
 * change_type values:
 * - 'role_change': Role was changed (promotion/demotion)
 * - 'status_change': Status was changed (active/inactive/terminated)
 * - 'office_change': Office assignment was changed
 * - 'reports_to_change': Manager (reports_to) was changed
 * - 'pay_plan_change': Pay plan was changed
 * - 'team_join': Person joined a team
 * - 'team_leave': Person left a team
 * - 'hired': Person was hired
 * - 'terminated': Person was terminated
 * - 'setter_tier_change': Setter tier was changed
 * 
 * previous_value and new_value are JSONB objects containing the relevant data.
 * For example, a role_change would have:
 * - previous_value: { role_id: 'uuid', role_name: 'Sales Rep' }
 * - new_value: { role_id: 'uuid', role_name: 'Team Lead' }
 */
export const personHistory = pgTable(
  'person_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personId: uuid('person_id').references(() => people.id).notNull(),
    changeType: varchar('change_type', { length: 50 }).notNull(),
    previousValue: jsonb('previous_value'),
    newValue: jsonb('new_value'),
    effectiveDate: date('effective_date').notNull(),
    reason: text('reason'), // explanation for the change
    changedById: uuid('changed_by_id').references(() => people.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxPersonHistoryPerson: index('idx_person_history_person').on(table.personId),
    idxPersonHistoryType: index('idx_person_history_type').on(table.changeType),
    idxPersonHistoryDate: index('idx_person_history_date').on(table.effectiveDate),
  })
);

export type PersonHistory = typeof personHistory.$inferSelect;
export type NewPersonHistory = typeof personHistory.$inferInsert;
