import { db } from './index';
import { people, personPayPlans, orgSnapshots, type Person } from './schema';
import { eq, and, lte, gte, isNull, or, desc } from 'drizzle-orm';

/**
 * Database helper functions for common operations.
 * 
 * These functions provide reusable query patterns for:
 * - Querying active people
 * - Getting person with relations
 * - Getting current pay plan for a person
 * - Getting or creating org snapshots
 * - Walking person hierarchies
 */

/**
 * Get all active people.
 */
export async function getActivePeople() {
  return await db
    .select()
    .from(people)
    .where(eq(people.status, 'active'));
}

/**
 * Get a person with all related data (role, office, reports_to, recruited_by).
 * Uses joins to fetch related entities in a single query.
 */
export async function getPersonWithRelations(personId: string) {
  // Note: This is a simplified version. In production, you'd want to use
  // Drizzle relations or multiple queries to fetch related data.
  const person = await db.query.people.findFirst({
    where: eq(people.id, personId),
    with: {
      // Relations would be defined in schema files if using Drizzle relations
    },
  });

  return person;
}

/**
 * Get the active pay plan for a person on a specific date.
 * Returns the pay plan that is effective on the given date.
 */
export async function getCurrentPayPlan(personId: string, date: Date = new Date()) {
  const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD

  const result = await db
    .select()
    .from(personPayPlans)
    .where(
      and(
        eq(personPayPlans.personId, personId),
        lte(personPayPlans.effectiveDate, dateStr),
        or(isNull(personPayPlans.endDate), gte(personPayPlans.endDate, dateStr))
      )
    )
    .orderBy(desc(personPayPlans.effectiveDate))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Get or create an org snapshot for a person on a specific date.
 * 
 * Org snapshots capture the complete organizational state at a point in time
 * for accurate historical commission calculations.
 * 
 * If a snapshot already exists for the person and date, returns it.
 * Otherwise, creates a new snapshot with current org state.
 */
export async function getOrgSnapshot(personId: string, snapshotDate: Date) {
  const dateStr = snapshotDate.toISOString().split('T')[0];

  // Check if snapshot already exists
  const existing = await db
    .select()
    .from(orgSnapshots)
    .where(and(eq(orgSnapshots.personId, personId), eq(orgSnapshots.snapshotDate, dateStr)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Get person with current state
  const person = await db.query.people.findFirst({
    where: eq(people.id, personId),
  });

  if (!person) {
    throw new Error(`Person with id ${personId} not found`);
  }

  // Get related data for snapshot
  // Note: In production, you'd want to fetch role, office, reports_to, recruited_by names
  // and current pay plan, teams, etc. This is a simplified version.

  const snapshot = await db
    .insert(orgSnapshots)
    .values({
      personId: person.id,
      snapshotDate: dateStr,
      roleId: person.roleId,
      officeId: person.officeId,
      reportsToId: person.reportsToId,
      recruitedById: person.recruitedById,
      setterTier: person.setterTier,
      // Additional fields would be populated here
    })
    .returning();

  return snapshot[0];
}

/**
 * Get the full reports_to hierarchy chain for a person.
 * Returns an array of people starting from the person and walking up the chain.
 */
export async function getPersonHierarchy(personId: string): Promise<Person[]> {
  const hierarchy: Person[] = [];
  let currentPersonId: string | null = personId;

  while (currentPersonId) {
    const person: Person | undefined = await db.query.people.findFirst({
      where: eq(people.id, currentPersonId),
    });

    if (!person) {
      break;
    }

    hierarchy.push(person);
    currentPersonId = person.reportsToId;
  }

  return hierarchy;
}

/**
 * Get the full recruited_by chain for a person.
 * Returns an array of people starting from the person and walking up the recruiting chain.
 */
export async function getRecruitingChain(personId: string): Promise<Person[]> {
  const chain: Person[] = [];
  let currentPersonId: string | null = personId;

  while (currentPersonId) {
    const person: Person | undefined = await db.query.people.findFirst({
      where: eq(people.id, currentPersonId),
    });

    if (!person) {
      break;
    }

    chain.push(person);
    currentPersonId = person.recruitedById;
  }

  return chain;
}
