import { db } from "@/lib/db";
import { orgSnapshots, teams, personTeams } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getPersonWithDetails } from "./person-helpers";
import { getPersonCurrentPayPlan } from "./pay-plan-helpers";
import type { OrgSnapshot, NewOrgSnapshot } from "@/lib/db/schema/org-snapshots";

/**
 * Create a new org snapshot for a person at a specific date.
 * Captures the complete organizational state at that point in time.
 */
export async function createOrgSnapshot(
  personId: string,
  snapshotDate: string
): Promise<OrgSnapshot> {
  // Get person with all related details
  const personDetails = await getPersonWithDetails(personId);

  if (!personDetails) {
    throw new Error(`Person not found: ${personId}`);
  }

  const { person, role, office, manager, recruiter, currentTeams } = personDetails;

  // Get pay plan active on snapshot date
  const payPlanAtDate = await getPersonCurrentPayPlan(personId, snapshotDate);

  // Get teams active on snapshot date
  const teamsAtDate = await db
    .select({
      team: teams,
      roleInTeam: personTeams.roleInTeam,
    })
    .from(personTeams)
    .innerJoin(teams, eq(personTeams.teamId, teams.id))
    .where(
      and(
        eq(personTeams.personId, personId),
        isNull(personTeams.endDate)
      )
    );

  // Build snapshot data
  const snapshotData: Omit<NewOrgSnapshot, "id" | "createdAt"> = {
    personId,
    snapshotDate,
    roleId: role?.id || null,
    roleName: role?.name || null,
    officeId: office?.id || null,
    officeName: office?.name || null,
    reportsToId: manager?.id || null,
    reportsToName: manager ? `${manager.firstName} ${manager.lastName}` : null,
    recruitedById: recruiter?.id || null,
    recruitedByName: recruiter ? `${recruiter.firstName} ${recruiter.lastName}` : null,
    payPlanId: payPlanAtDate?.payPlan.id || null,
    payPlanName: payPlanAtDate?.payPlan.name || null,
    setterTier: person.setterTier || null,
    teamIds: teamsAtDate.map((t) => t.team.id),
    teamNames: teamsAtDate.map((t) => t.team.name),
  };

  // Insert snapshot (will fail if unique constraint violated)
  const [snapshot] = await db
    .insert(orgSnapshots)
    .values(snapshotData)
    .returning();

  return snapshot;
}

/**
 * Get an existing org snapshot for a person at a specific date.
 */
export async function getOrgSnapshot(
  personId: string,
  snapshotDate: string
): Promise<OrgSnapshot | null> {
  const [snapshot] = await db
    .select()
    .from(orgSnapshots)
    .where(
      and(
        eq(orgSnapshots.personId, personId),
        eq(orgSnapshots.snapshotDate, snapshotDate)
      )
    )
    .limit(1);

  return snapshot || null;
}

/**
 * Get or create an org snapshot for a person at a specific date.
 * Returns existing snapshot if found, otherwise creates a new one.
 */
export async function getOrCreateOrgSnapshot(
  personId: string,
  snapshotDate: string
): Promise<OrgSnapshot> {
  // Try to get existing snapshot
  const existing = await getOrgSnapshot(personId, snapshotDate);
  if (existing) {
    return existing;
  }

  // Create new snapshot
  return await createOrgSnapshot(personId, snapshotDate);
}
