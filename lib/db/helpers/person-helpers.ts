import { db } from "@/lib/db";
import {
  people,
  roles,
  offices,
  teams,
  payPlans,
  personTeams,
  personPayPlans,
  personHistory,
} from "@/lib/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import type { PersonWithDetails, PersonHistoryWithChanger } from "@/types/people";
import type { NewPersonHistory } from "@/lib/db/schema";

/**
 * Fetch person with all related details
 */
export async function getPersonWithDetails(
  personId: string
): Promise<PersonWithDetails | null> {
  // Fetch person with role and office
  const personData = await db
    .select({
      person: people,
      role: roles,
      office: offices,
    })
    .from(people)
    .leftJoin(roles, eq(people.roleId, roles.id))
    .leftJoin(offices, eq(people.officeId, offices.id))
    .where(eq(people.id, personId))
    .limit(1);

  if (!personData[0]) {
    return null;
  }

  const { person, role, office } = personData[0];

  // Fetch manager if exists
  let manager = null;
  if (person.reportsToId) {
    const managerData = await db
      .select({
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
      })
      .from(people)
      .where(eq(people.id, person.reportsToId))
      .limit(1);
    manager = managerData[0] || null;
  }

  // Fetch recruiter if exists
  let recruiter = null;
  if (person.recruitedById) {
    const recruiterData = await db
      .select({
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
      })
      .from(people)
      .where(eq(people.id, person.recruitedById))
      .limit(1);
    recruiter = recruiterData[0] || null;
  }

  // Fetch current teams
  const currentTeamsData = await db
    .select({
      team: teams,
      roleInTeam: personTeams.roleInTeam,
      effectiveDate: personTeams.effectiveDate,
    })
    .from(personTeams)
    .innerJoin(teams, eq(personTeams.teamId, teams.id))
    .where(
      and(
        eq(personTeams.personId, personId),
        isNull(personTeams.endDate)
      )
    );

  // Fetch current pay plan
  const currentPayPlanData = await db
    .select({
      payPlan: payPlans,
      effectiveDate: personPayPlans.effectiveDate,
      notes: personPayPlans.notes,
    })
    .from(personPayPlans)
    .innerJoin(payPlans, eq(personPayPlans.payPlanId, payPlans.id))
    .where(
      and(
        eq(personPayPlans.personId, personId),
        isNull(personPayPlans.endDate)
      )
    )
    .limit(1);

  return {
    person,
    role: role || null,
    office: office || null,
    manager,
    recruiter,
    currentTeams: currentTeamsData.map((t) => ({
      team: t.team,
      roleInTeam: t.roleInTeam || "member",
      effectiveDate: t.effectiveDate,
    })),
    currentPayPlan: currentPayPlanData[0]
      ? {
          payPlan: currentPayPlanData[0].payPlan,
          effectiveDate: currentPayPlanData[0].effectiveDate,
          notes: currentPayPlanData[0].notes,
        }
      : null,
  };
}

/**
 * Fetch complete person history ordered by date
 */
export async function getPersonHistory(
  personId: string
): Promise<PersonHistoryWithChanger[]> {
  const history = await db
    .select({
      history: personHistory,
      changedBy: {
        firstName: people.firstName,
        lastName: people.lastName,
      },
    })
    .from(personHistory)
    .leftJoin(people, eq(personHistory.changedById, people.id))
    .where(eq(personHistory.personId, personId))
    .orderBy(
      desc(personHistory.effectiveDate),
      desc(personHistory.createdAt)
    );

  return history.map((h) => ({
    history: h.history,
    changedBy: h.changedBy.firstName
      ? {
          firstName: h.changedBy.firstName,
          lastName: h.changedBy.lastName,
        }
      : null,
  }));
}

/**
 * Get current active pay plan for a person
 */
export async function getCurrentPayPlan(personId: string) {
  const result = await db
    .select({
      payPlan: payPlans,
      effectiveDate: personPayPlans.effectiveDate,
      notes: personPayPlans.notes,
    })
    .from(personPayPlans)
    .innerJoin(payPlans, eq(personPayPlans.payPlanId, payPlans.id))
    .where(
      and(
        eq(personPayPlans.personId, personId),
        isNull(personPayPlans.endDate)
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Get current active team memberships for a person
 */
export async function getCurrentTeams(personId: string) {
  const result = await db
    .select({
      team: teams,
      roleInTeam: personTeams.roleInTeam,
      effectiveDate: personTeams.effectiveDate,
    })
    .from(personTeams)
    .innerJoin(teams, eq(personTeams.teamId, teams.id))
    .where(
      and(
        eq(personTeams.personId, personId),
        isNull(personTeams.endDate)
      )
    );

  return result;
}

/**
 * Get IDs of all people who report directly to the given user.
 * Used for team performance metrics (Team Leads see direct reports).
 */
export async function getDirectReportIds(userId: string): Promise<string[]> {
  const results = await db
    .select({ id: people.id })
    .from(people)
    .where(eq(people.reportsToId, userId));
  return results.map((r) => r.id);
}

/**
 * Create a person history record
 */
export async function createPersonHistoryRecord(
  data: Omit<NewPersonHistory, "id" | "createdAt">
) {
  const [record] = await db
    .insert(personHistory)
    .values(data)
    .returning();

  return record;
}
