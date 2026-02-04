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
  recruits,
  officeLeadership,
} from "@/lib/db/schema";
import { eq, and, isNull, isNotNull, desc, inArray } from "drizzle-orm";
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
      effectiveDate: t.effectiveDate ? new Date(t.effectiveDate) : null,
    })),
    currentPayPlan: currentPayPlanData[0]
      ? {
          payPlan: currentPayPlanData[0].payPlan,
          effectiveDate: currentPayPlanData[0].effectiveDate
            ? new Date(currentPayPlanData[0].effectiveDate)
            : null,
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
    changedBy:
      h.changedBy?.firstName != null
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

/**
 * Get document metadata for recruits with signed agreements recruited by this person.
 * Used by the person documents tab.
 */
export async function getPersonDocuments(personId: string) {
  const rows = await db
    .select({
      recruitId: recruits.id,
      firstName: recruits.firstName,
      lastName: recruits.lastName,
      documentPath: recruits.agreementDocumentPath,
      signedAt: recruits.agreementSignedAt,
    })
    .from(recruits)
    .where(
      and(
        eq(recruits.recruiterId, personId),
        isNotNull(recruits.agreementDocumentPath),
        isNotNull(recruits.agreementSignedAt)
      )
    );

  return rows
    .filter((r) => r.documentPath != null && r.signedAt != null)
    .map((r) => ({
      recruitId: r.recruitId,
      recruitName: `${r.firstName} ${r.lastName}`,
      documentPath: r.documentPath as string,
      signedAt: (r.signedAt as Date).toISOString(),
    }));
}

// ============================================================================
// Organizational Hierarchy Helper Functions
// ============================================================================

/**
 * Visibility scope type representing the hierarchical level a user can access.
 */
export type VisibilityScope = {
  type: 'all' | 'region' | 'office' | 'team' | 'self';
  regionId?: string;
  officeIds?: string[];
  teamId?: string;
  personIds?: string[];
};

/**
 * Get the region ID a user manages (if they're a Regional Manager).
 * Checks office_leadership for an active 'regional' role.
 */
export async function getManagedRegionId(userId: string): Promise<string | null> {
  const [leadership] = await db
    .select({ regionId: officeLeadership.regionId })
    .from(officeLeadership)
    .where(
      and(
        eq(officeLeadership.personId, userId),
        eq(officeLeadership.roleType, 'regional'),
        isNull(officeLeadership.effectiveTo)
      )
    )
    .limit(1);
  return leadership?.regionId ?? null;
}

/**
 * Get the office ID a user manages (if they're an Area Director).
 * Checks office_leadership for an active 'ad' role.
 */
export async function getManagedOfficeId(userId: string): Promise<string | null> {
  const [leadership] = await db
    .select({ officeId: officeLeadership.officeId })
    .from(officeLeadership)
    .where(
      and(
        eq(officeLeadership.personId, userId),
        eq(officeLeadership.roleType, 'ad'),
        isNull(officeLeadership.effectiveTo)
      )
    )
    .limit(1);
  return leadership?.officeId ?? null;
}

/**
 * Get the team ID a user leads (if they're a Team Lead).
 * Checks the teams table for teamLeadId match.
 */
export async function getManagedTeamId(userId: string): Promise<string | null> {
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.teamLeadId, userId))
    .limit(1);
  return team?.id ?? null;
}

/**
 * Get all office IDs in a region.
 */
export async function getOfficeIdsInRegion(regionId: string): Promise<string[]> {
  const results = await db
    .select({ id: offices.id })
    .from(offices)
    .where(eq(offices.regionId, regionId));
  return results.map((r) => r.id);
}

/**
 * Get all person IDs in an office.
 */
export async function getPersonIdsInOffice(officeId: string): Promise<string[]> {
  const results = await db
    .select({ id: people.id })
    .from(people)
    .where(eq(people.officeId, officeId));
  return results.map((r) => r.id);
}

/**
 * Get all person IDs in multiple offices.
 */
export async function getPersonIdsInOffices(officeIds: string[]): Promise<string[]> {
  if (officeIds.length === 0) return [];
  const results = await db
    .select({ id: people.id })
    .from(people)
    .where(inArray(people.officeId, officeIds));
  return results.map((r) => r.id);
}

/**
 * Get all person IDs in a team.
 * Only returns active team memberships (endDate IS NULL).
 */
export async function getPersonIdsInTeam(teamId: string): Promise<string[]> {
  const results = await db
    .select({ personId: personTeams.personId })
    .from(personTeams)
    .where(
      and(
        eq(personTeams.teamId, teamId),
        isNull(personTeams.endDate)
      )
    );
  return results.map((r) => r.personId);
}

/**
 * Get full visibility scope for a user based on their role in the hierarchy.
 *
 * Hierarchy:
 * - Regional Manager → All offices/teams/people in their region
 * - Area Director → All teams/people in their office
 * - Team Lead → All people in their team
 * - Sales Rep → Own data only
 *
 * @param userId - The user ID to check
 * @param userOfficeId - The user's office ID (for fallback)
 * @returns VisibilityScope object describing what the user can see
 */
export async function getVisibilityScope(
  userId: string,
  userOfficeId: string | null
): Promise<VisibilityScope> {
  // Check if Regional Manager
  const regionId = await getManagedRegionId(userId);
  if (regionId) {
    const officeIds = await getOfficeIdsInRegion(regionId);
    return { type: 'region', regionId, officeIds };
  }

  // Check if Area Director
  const managedOfficeId = await getManagedOfficeId(userId);
  if (managedOfficeId) {
    return { type: 'office', officeIds: [managedOfficeId] };
  }

  // Check if Team Lead
  const teamId = await getManagedTeamId(userId);
  if (teamId) {
    const personIds = await getPersonIdsInTeam(teamId);
    // Include the team lead themselves
    if (!personIds.includes(userId)) {
      personIds.push(userId);
    }
    return { type: 'team', teamId, personIds };
  }

  // Default: own data only
  return { type: 'self', personIds: [userId] };
}
