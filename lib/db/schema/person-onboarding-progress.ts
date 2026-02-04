import { pgTable, uuid, boolean, timestamp, text, unique } from 'drizzle-orm/pg-core';
import { people } from './people';
import { onboardingTasks } from './onboarding-tasks';

export const personOnboardingProgress = pgTable('person_onboarding_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').notNull().references(() => onboardingTasks.id, { onDelete: 'cascade' }),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  completedBy: uuid('completed_by').references(() => people.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniquePersonTask: unique().on(table.personId, table.taskId),
}));

export type PersonOnboardingProgress = typeof personOnboardingProgress.$inferSelect;
export type NewPersonOnboardingProgress = typeof personOnboardingProgress.$inferInsert;
