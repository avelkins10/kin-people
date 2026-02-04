import { db } from "@/lib/db";
import {
  recruits,
  recruitHistory,
  people,
  offices,
  teams,
  roles,
  payPlans,
  personPayPlans,
  personTeams,
  personHistory,
  onboardingTasks,
  personOnboardingProgress,
} from "@/lib/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import type { Recruit, NewRecruit } from "@/lib/db/schema/recruits";
import type { NewRecruitHistory } from "@/lib/db/schema/recruit-history";
import { sendWelcomeEmail } from "@/lib/services/email-service";
import { generateKinId } from "@/lib/db/helpers/kin-id-helpers";
import { normalizePhone, checkForDuplicatePerson } from "@/lib/db/helpers/duplicate-helpers";

export interface RecruitWithDetails {
  recruit: Recruit;
  recruiter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  targetOffice: {
    id: string;
    name: string;
  } | null;
  targetTeam: {
    id: string;
    name: string;
  } | null;
  targetReportsTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  targetRole: {
    id: string;
    name: string;
  } | null;
  targetPayPlan: {
    id: string;
    name: string;
  } | null;
}

export interface RecruitHistoryWithChanger {
  history: typeof recruitHistory.$inferSelect;
  changedBy: {
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * Fetch recruit with all related details
 */
export async function getRecruitWithDetails(
  recruitId: string
): Promise<RecruitWithDetails | null> {
  // Fetch recruit with all joins
  const recruitData = await db
    .select({
      recruit: recruits,
      recruiter: {
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
      },
      targetOffice: {
        id: offices.id,
        name: offices.name,
      },
      targetTeam: {
        id: teams.id,
        name: teams.name,
      },
      targetReportsTo: {
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
      },
      targetRole: {
        id: roles.id,
        name: roles.name,
      },
      targetPayPlan: {
        id: payPlans.id,
        name: payPlans.name,
      },
    })
    .from(recruits)
    .leftJoin(people, eq(recruits.recruiterId, people.id))
    .leftJoin(offices, eq(recruits.targetOfficeId, offices.id))
    .leftJoin(teams, eq(recruits.targetTeamId, teams.id))
    .leftJoin(roles, eq(recruits.targetRoleId, roles.id))
    .leftJoin(payPlans, eq(recruits.targetPayPlanId, payPlans.id))
    .where(eq(recruits.id, recruitId))
    .limit(1);

  if (!recruitData[0]) {
    return null;
  }

  const data = recruitData[0];

  // Fetch targetReportsTo separately since we need a different join
  let targetReportsTo = null;
  if (data.recruit.targetReportsToId) {
    const reportsToData = await db
      .select({
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
      })
      .from(people)
      .where(eq(people.id, data.recruit.targetReportsToId))
      .limit(1);
    targetReportsTo = reportsToData[0] || null;
  }

  return {
    recruit: data.recruit,
    recruiter: data.recruiter,
    targetOffice: data.targetOffice,
    targetTeam: data.targetTeam,
    targetReportsTo,
    targetRole: data.targetRole,
    targetPayPlan: data.targetPayPlan,
  };
}

/**
 * Fetch all recruits for a specific recruiter
 */
export async function getRecruitsByRecruiter(recruiterId: string) {
  const results = await db
    .select({
      recruit: recruits,
      targetOffice: {
        id: offices.id,
        name: offices.name,
      },
      targetRole: {
        id: roles.id,
        name: roles.name,
      },
    })
    .from(recruits)
    .leftJoin(offices, eq(recruits.targetOfficeId, offices.id))
    .leftJoin(roles, eq(recruits.targetRoleId, roles.id))
    .where(eq(recruits.recruiterId, recruiterId))
    .orderBy(desc(recruits.createdAt));

  return results;
}

/**
 * Fetch recruits based on user's role and permissions
 * This is a helper that returns a query builder with visibility filters applied
 */
export function getRecruitsWithVisibility(user: {
  id: string;
  officeId: string | null;
  roleName: string;
}) {
  let query = db
    .select({
      recruit: recruits,
      recruiter: {
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
      },
      targetOffice: {
        id: offices.id,
        name: offices.name,
      },
      targetRole: {
        id: roles.id,
        name: roles.name,
      },
    })
    .from(recruits)
    .leftJoin(people, eq(recruits.recruiterId, people.id))
    .leftJoin(offices, eq(recruits.targetOfficeId, offices.id))
    .leftJoin(roles, eq(recruits.targetRoleId, roles.id));

  // Apply visibility filters based on role
  // Admins and Regional Managers see all
  // Office Managers see their office's recruits
  // Team Leads see their team's recruits
  // Recruiters see their own recruits

  // For now, we'll apply basic filtering - this will be enhanced by visibility-rules.ts
  // Recruiters see their own
  if (user.roleName === "Sales Rep" || user.roleName === "Recruiter") {
    query = query.where(eq(recruits.recruiterId, user.id)) as any;
  } else if (user.roleName === "Office Manager" && user.officeId) {
    // Office managers see recruits targeting their office
    query = query.where(eq(recruits.targetOfficeId, user.officeId)) as any;
  }
  // Admins and Regional Managers see all (no filter)

  return query.orderBy(desc(recruits.createdAt));
}

/**
 * Fetch complete recruit history ordered by date
 */
export async function getRecruitHistory(
  recruitId: string
): Promise<RecruitHistoryWithChanger[]> {
  const history = await db
    .select({
      history: recruitHistory,
      changedBy: {
        firstName: people.firstName,
        lastName: people.lastName,
      },
    })
    .from(recruitHistory)
    .leftJoin(people, eq(recruitHistory.changedById, people.id))
    .where(eq(recruitHistory.recruitId, recruitId))
    .orderBy(desc(recruitHistory.createdAt));

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
 * Create a recruit history record
 */
export async function createRecruitHistoryRecord(
  data: Omit<NewRecruitHistory, "id" | "createdAt">
) {
  const [record] = await db
    .insert(recruitHistory)
    .values(data)
    .returning();

  return record;
}

/**
 * Update recruit status and create history record
 */
export async function updateRecruitStatus(
  recruitId: string,
  newStatus: string,
  userId: string,
  notes?: string
) {
  // Get current recruit
  const [currentRecruit] = await db
    .select()
    .from(recruits)
    .where(eq(recruits.id, recruitId))
    .limit(1);

  if (!currentRecruit) {
    throw new Error("Recruit not found");
  }

  // Update recruit status
  const [updated] = await db
    .update(recruits)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(recruits.id, recruitId))
    .returning();

  // Create history record
  await createRecruitHistoryRecord({
    recruitId,
    previousStatus: currentRecruit.status || null,
    newStatus,
    notes: notes || null,
    changedById: userId,
  });

  return updated;
}

/**
 * Convert a recruit to a person and initialize onboarding.
 * Called automatically when rep agreement is signed.
 *
 * - Creates person with status "onboarding"
 * - Sets up pay plan and team if configured
 * - Initializes onboarding task progress
 * - Updates recruit status to "onboarding" (keeps them visible in pipeline)
 */
export async function convertRecruitToOnboarding(
  recruitId: string
): Promise<{ personId: string } | null> {
  const recruitData = await getRecruitWithDetails(recruitId);
  if (!recruitData) {
    console.error("[convertRecruitToOnboarding] Recruit not found:", recruitId);
    return null;
  }

  const { recruit, targetOffice, targetRole, targetPayPlan, targetTeam, targetReportsTo } = recruitData;

  // Skip if already converted
  if (recruit.convertedToPersonId) {
    console.log("[convertRecruitToOnboarding] Recruit already converted:", recruitId);
    return { personId: recruit.convertedToPersonId };
  }

  // Require office and role
  if (!targetOffice || !targetRole) {
    console.warn("[convertRecruitToOnboarding] Missing target office or role for recruit:", recruitId);
    return null;
  }

  // Check for duplicate person before conversion
  if (recruit.email) {
    const duplicatePerson = await checkForDuplicatePerson(recruit.email, recruit.phone);
    if (duplicatePerson.isDuplicate) {
      console.warn(
        "[convertRecruitToOnboarding] Duplicate person found for recruit:",
        recruitId,
        duplicatePerson.existingRecord
      );
      return null;
    }
  }

  const hireDate = new Date().toISOString().split("T")[0]; // Today's date

  try {
    const result = await db.transaction(async (tx) => {
      // Generate KIN ID for the new person
      const kinId = await generateKinId(tx);

      // Normalize phone for storage
      const normalizedPhone = normalizePhone(recruit.phone);

      // Create person with onboarding status
      const [newPerson] = await tx
        .insert(people)
        .values({
          kinId,
          firstName: recruit.firstName ?? "",
          lastName: recruit.lastName ?? "",
          email: recruit.email ?? "",
          phone: recruit.phone ?? null,
          normalizedPhone,
          officeId: targetOffice.id,
          roleId: targetRole.id,
          reportsToId: targetReportsTo?.id ?? null,
          recruitedById: recruit.recruiterId ?? null,
          status: "onboarding",
          hireDate,
        })
        .returning();

      // Create pay plan record
      if (targetPayPlan) {
        await tx.insert(personPayPlans).values({
          personId: newPerson.id,
          payPlanId: targetPayPlan.id,
          effectiveDate: hireDate,
          notes: "Assigned from automatic recruit conversion",
        });
      }

      // Create team record
      if (targetTeam) {
        await tx.insert(personTeams).values({
          personId: newPerson.id,
          teamId: targetTeam.id,
          roleInTeam: "member",
          effectiveDate: hireDate,
        });
      }

      // Create person history record
      await tx.insert(personHistory).values({
        personId: newPerson.id,
        changeType: "hired",
        previousValue: null,
        newValue: {
          office_id: targetOffice.id,
          office_name: targetOffice.name,
          role_id: targetRole.id,
          role_name: targetRole.name,
          hire_date: hireDate,
          auto_converted: true,
        },
        effectiveDate: hireDate,
        reason: "Auto-converted from recruit after agreement signed",
        changedById: null, // System action
      });

      // Update recruit to onboarding status (keeps in pipeline)
      await tx
        .update(recruits)
        .set({
          convertedToPersonId: newPerson.id,
          convertedAt: new Date(),
          status: "onboarding",
          updatedAt: new Date(),
        })
        .where(eq(recruits.id, recruitId));

      // Create recruit history record
      await tx.insert(recruitHistory).values({
        recruitId,
        previousStatus: recruit.status,
        newStatus: "onboarding",
        notes: `Auto-converted to person (${newPerson.id}) after agreement signed`,
        changedById: null, // System action
      });

      // Initialize onboarding tasks
      const activeTasks = await tx
        .select({ id: onboardingTasks.id })
        .from(onboardingTasks)
        .where(eq(onboardingTasks.isActive, true));

      if (activeTasks.length > 0) {
        const progressRecords = activeTasks.map((task) => ({
          personId: newPerson.id,
          taskId: task.id,
          completed: false,
        }));
        await tx
          .insert(personOnboardingProgress)
          .values(progressRecords)
          .onConflictDoNothing();
      }

      return newPerson;
    });

    console.log(
      `[convertRecruitToOnboarding] Recruit ${recruitId} converted to person ${result.id} (${result.kinId}) with onboarding status`
    );

    // Send welcome email to the new hire (async, don't block on failure)
    if (recruit.email) {
      sendWelcomeEmail({
        email: recruit.email,
        firstName: recruit.firstName ?? '',
        lastName: recruit.lastName ?? undefined,
        managerName: targetReportsTo
          ? `${targetReportsTo.firstName} ${targetReportsTo.lastName}`.trim()
          : undefined,
        officeName: targetOffice?.name,
      }).then((emailResult) => {
        if (emailResult.success) {
          console.log(`[convertRecruitToOnboarding] Welcome email sent to ${recruit.email}`);
        } else {
          console.warn(`[convertRecruitToOnboarding] Failed to send welcome email: ${emailResult.error}`);
        }
      }).catch((err) => {
        console.warn('[convertRecruitToOnboarding] Welcome email error:', err);
      });
    }

    return { personId: result.id };
  } catch (err) {
    console.error("[convertRecruitToOnboarding] Failed to convert recruit:", {
      recruitId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
