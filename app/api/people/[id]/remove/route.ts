import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  people,
  recruits,
  documents,
  teams,
  personHistory,
  commissionHistory,
  activityLog,
  orgSnapshots,
  personTeams,
  personPayPlans,
  personOnboardingProgress,
  recruitHistory,
} from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { canManagePerson } from "@/lib/auth/visibility-rules";

/**
 * DELETE /api/people/[id]/remove
 * Permanently remove a person (e.g. duplicate). Only allowed when the person
 * has no deals, commissions, or recruits they're responsible for.
 *
 * All references to people.id are handled:
 * - Block: deals (setter/closer), commissions, recruits.recruiterId
 * - Null then delete: people.reportsToId/recruitedById, recruits.targetReportsToId/convertedToPersonId,
 *   documents.personId/createdById, teams.teamLeadId, personHistory.changedById, commissionHistory.changedById,
 *   activityLog.actorId, orgSnapshots.reportsToId/recruitedById, personOnboardingProgress.completedBy, recruitHistory.changedById
 * - Delete: personHistory (personId), orgSnapshots (personId), personTeams, personPayPlans
 * - DB cascade on person delete: office_leadership, person_onboarding_info, person_onboarding_progress
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
    try {
      const canManage = await canManagePerson(user, id);
      if (!canManage) {
        return NextResponse.json(
          { error: "You do not have permission to remove this person" },
          { status: 403 }
        );
      }

      const { deals, commissions } = await import("@/lib/db/schema");

      const dealRows = await db.select({ id: deals.id }).from(deals).where(or(eq(deals.setterId, id), eq(deals.closerId, id))).limit(1);
      const commissionRows = await db.select({ id: commissions.id }).from(commissions).where(eq(commissions.personId, id)).limit(1);
      const recruiterRows = await db.select({ id: recruits.id }).from(recruits).where(eq(recruits.recruiterId, id)).limit(1);

      if (dealRows.length > 0) {
        return NextResponse.json(
          { error: "Cannot remove: this person has deals. Terminate them instead if they've left." },
          { status: 400 }
        );
      }
      if (commissionRows.length > 0) {
        return NextResponse.json(
          { error: "Cannot remove: this person has commission records. Terminate them instead if they've left." },
          { status: 400 }
        );
      }
      if (recruiterRows.length > 0) {
        return NextResponse.json(
          { error: "Cannot remove: this person is listed as recruiter for recruits. Reassign or remove those recruits first." },
          { status: 400 }
        );
      }

      await db.transaction(async (tx) => {
        await tx.update(people).set({ reportsToId: null }).where(eq(people.reportsToId, id));
        await tx.update(people).set({ recruitedById: null }).where(eq(people.recruitedById, id));
        await tx.update(recruits).set({ targetReportsToId: null }).where(eq(recruits.targetReportsToId, id));
        await tx.update(recruits).set({ convertedToPersonId: null }).where(eq(recruits.convertedToPersonId, id));
        await tx.update(documents).set({ personId: null }).where(eq(documents.personId, id));
        await tx.update(documents).set({ createdById: null }).where(eq(documents.createdById, id));
        await tx.update(teams).set({ teamLeadId: null }).where(eq(teams.teamLeadId, id));
        await tx.delete(personHistory).where(eq(personHistory.personId, id));
        await tx.update(personHistory).set({ changedById: null }).where(eq(personHistory.changedById, id));
        await tx.update(commissionHistory).set({ changedById: null }).where(eq(commissionHistory.changedById, id));
        await tx.update(activityLog).set({ actorId: null }).where(eq(activityLog.actorId, id));
        await tx.update(orgSnapshots).set({ reportsToId: null, reportsToName: null }).where(eq(orgSnapshots.reportsToId, id));
        await tx.update(orgSnapshots).set({ recruitedById: null, recruitedByName: null }).where(eq(orgSnapshots.recruitedById, id));
        await tx.delete(orgSnapshots).where(eq(orgSnapshots.personId, id));
        await tx.delete(personTeams).where(eq(personTeams.personId, id));
        await tx.delete(personPayPlans).where(eq(personPayPlans.personId, id));
        await tx.update(personOnboardingProgress).set({ completedBy: null }).where(eq(personOnboardingProgress.completedBy, id));
        await tx.update(recruitHistory).set({ changedById: null }).where(eq(recruitHistory.changedById, id));
        await tx.delete(people).where(eq(people.id, id));
      });

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Error removing person:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Failed to remove person" },
        { status: 500 }
      );
    }
  })(req);
}
