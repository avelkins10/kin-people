import { pgTable, integer } from 'drizzle-orm/pg-core';

/**
 * Single-row table for atomic KIN ID sequence generation.
 * Uses CHECK constraint to ensure only one row exists.
 */
export const kinIdSequence = pgTable('kin_id_sequence', {
  id: integer('id').primaryKey().default(1),
  lastValue: integer('last_value').notNull().default(0),
});

export type KinIdSequence = typeof kinIdSequence.$inferSelect;
