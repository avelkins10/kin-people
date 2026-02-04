import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, varchar } from 'drizzle-orm/pg-core';

/**
 * Task types for onboarding tasks:
 * - manual: Simple checkbox task (default)
 * - info_collection: Rep fills out a form
 * - automated: System performs action (send email, create account)
 * - document: Sign/upload document
 * - meeting: Schedule/complete meeting
 */
export const TASK_TYPES = ['manual', 'info_collection', 'automated', 'document', 'meeting'] as const;
export type TaskType = typeof TASK_TYPES[number];

/**
 * Automation types for automated tasks:
 * - email: Send an email
 * - api_call: Make an API call
 * - webhook: Trigger a webhook
 */
export const AUTOMATION_TYPES = ['email', 'api_call', 'webhook'] as const;
export type AutomationType = typeof AUTOMATION_TYPES[number];

/**
 * Assignee types for who is responsible for completing the task:
 * - new_hire: The new employee completes this
 * - manager: The manager completes this
 * - admin: HR/admin completes this
 */
export const ASSIGNEE_TYPES = ['new_hire', 'manager', 'admin'] as const;
export type AssigneeType = typeof ASSIGNEE_TYPES[number];

/**
 * Categories for grouping tasks:
 * - admin: Paperwork, HR tasks
 * - training: Learning/courses
 * - equipment: Physical items
 * - software: System access
 * - personal_info: Info collection
 * - meeting: Manager/team meetings
 * - setup: General setup tasks
 */
export const TASK_CATEGORIES = ['admin', 'training', 'equipment', 'software', 'personal_info', 'meeting', 'setup'] as const;
export type TaskCategory = typeof TASK_CATEGORIES[number];

export const onboardingTasks = pgTable('onboarding_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  taskOrder: integer('task_order').notNull(),
  category: text('category').notNull(), // 'admin', 'training', 'equipment', 'software', 'personal_info', 'meeting', 'setup'
  isActive: boolean('is_active').default(true),

  // New fields for task types and automation
  taskType: varchar('task_type', { length: 50 }).default('manual'), // manual, info_collection, automated, document, meeting
  requiresInput: boolean('requires_input').default(false),
  inputFields: jsonb('input_fields'), // Schema for input fields when requiresInput is true
  isAutomated: boolean('is_automated').default(false),
  automationType: varchar('automation_type', { length: 50 }), // email, api_call, webhook
  automationConfig: jsonb('automation_config'), // Config for automation
  assigneeType: varchar('assignee_type', { length: 50 }).default('new_hire'), // new_hire, manager, admin
  dueDays: integer('due_days'), // Days from hire date to complete
  blockedBy: uuid('blocked_by').array(), // Array of task IDs that must complete first

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type OnboardingTask = typeof onboardingTasks.$inferSelect;
export type NewOnboardingTask = typeof onboardingTasks.$inferInsert;
