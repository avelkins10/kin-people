import { db } from "@/lib/db";
import { people, recruits, deals, commissions, roles } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";
import type { CurrentUser } from "./get-current-user";
import { Permission } from "@/lib/permissions/types";
import { hasPermission } from "./check-permission";

/**
 * Get visibility filter criteria based on user role.
 * 
 * Returns filter conditions that should be applied to queries
 * to restrict data access based on the user's role.
 * 
 * @param user - The current user object
 * @returns Filter conditions object, or null for no restrictions
 */
export function getVisibilityFilter(user: NonNullable<CurrentUser>) {
  // Admin and Regional Manager can see all
  if (
    hasPermission(user, Permission.VIEW_ALL_PEOPLE) ||
    hasPermission(user, Permission.MANAGE_OWN_REGION)
  ) {
    return null; // No filter
  }

  // Office Manager: filter by office
  if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
    if (!user.officeId) {
      return { id: user.id }; // Fallback to own data if no office
    }
    return { officeId: user.officeId };
  }

  // Team Lead: filter by office OR reports to them
  // Note: This returns a simple object for reference; actual filtering
  // should use Drizzle's or() function in queries
  if (hasPermission(user, Permission.MANAGE_OWN_TEAM)) {
    if (!user.officeId) {
      return { id: user.id }; // Fallback to own data
    }
    return {
      officeId: user.officeId,
      reportsToId: user.id,
    };
  }

  // Sales Rep: only own data
  return { id: user.id };
}

/**
 * Check if a user can view a specific person.
 * 
 * @param user - The current user object
 * @param targetPersonId - The ID of the person to check access for
 * @returns Promise resolving to true if user can view, false otherwise
 */
export async function canViewPerson(
  user: NonNullable<CurrentUser>,
  targetPersonId: string
): Promise<boolean> {
  // Admin and Regional Manager can see all
  if (
    hasPermission(user, Permission.VIEW_ALL_PEOPLE) ||
    hasPermission(user, Permission.MANAGE_OWN_REGION)
  ) {
    return true;
  }

  // If checking own record, always allowed
  if (user.id === targetPersonId) {
    return true;
  }

  try {
    const targetPerson = await db
      .select()
      .from(people)
      .where(eq(people.id, targetPersonId))
      .limit(1);

    if (!targetPerson[0]) {
      return false;
    }

    const person = targetPerson[0];

    // Office Manager: check if same office
    if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
      return person.officeId === user.officeId;
    }

    // Team Lead: check if same office or reports to them
    if (hasPermission(user, Permission.MANAGE_OWN_TEAM)) {
      return (
        person.officeId === user.officeId ||
        person.reportsToId === user.id
      );
    }

    // Sales Rep: only own data
    return false;
  } catch (error) {
    console.error("Error checking person visibility:", error);
    return false;
  }
}

/**
 * Check if a user can manage a specific person based on their permission scope.
 * 
 * This verifies that the target person is within the caller's allowed scope:
 * - MANAGE_ALL_OFFICES: can manage anyone
 * - MANAGE_OWN_REGION: can manage anyone in their region
 * - MANAGE_OWN_OFFICE: can only manage people in their office
 * 
 * @param user - The current user object
 * @param targetPersonId - The ID of the person to check access for
 * @returns Promise resolving to true if user can manage, false otherwise
 */
export async function canManagePerson(
  user: NonNullable<CurrentUser>,
  targetPersonId: string
): Promise<boolean> {
  // Admin with MANAGE_ALL_OFFICES can manage anyone
  if (hasPermission(user, Permission.MANAGE_ALL_OFFICES)) {
    return true;
  }

  // Regional Manager with MANAGE_OWN_REGION can manage anyone in their region
  // (For now, we'll allow them to manage anyone since region checking would require region data)
  if (hasPermission(user, Permission.MANAGE_OWN_REGION)) {
    return true;
  }

  // If checking own record, always allowed
  if (user.id === targetPersonId) {
    return true;
  }

  try {
    const targetPerson = await db
      .select()
      .from(people)
      .where(eq(people.id, targetPersonId))
      .limit(1);

    if (!targetPerson[0]) {
      return false;
    }

    const person = targetPerson[0];

    // Office Manager: can only manage people in their office
    if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
      if (!user.officeId) {
        return false; // No office assigned, can't manage others
      }
      return person.officeId === user.officeId;
    }

    // Team Lead: can only manage their direct reports
    if (hasPermission(user, Permission.MANAGE_OWN_TEAM)) {
      return person.reportsToId === user.id;
    }

    // Sales Rep: can only manage themselves
    return false;
  } catch (error) {
    console.error("Error checking person management access:", error);
    return false;
  }
}

/**
 * Check if a user can view a specific commission.
 * 
 * @param user - The current user object
 * @param commission - The commission object to check
 * @returns Promise resolving to true if user can view, false otherwise
 */
export async function canViewCommission(
  user: NonNullable<CurrentUser>,
  commission: { personId: string; reportsToId?: string | null; dealId?: string; commissionType?: string }
): Promise<boolean> {
  // User is the commission recipient
  if (commission.personId === user.id) {
    return true;
  }

  // Special case: Closer transparency - if user is a Closer and this is a Setter commission on the same deal
  if (commission.dealId && commission.commissionType === "setter") {
    try {
      // Fetch the deal to check if user is the closer
      const [dealData] = await db
        .select()
        .from(deals)
        .where(eq(deals.id, commission.dealId))
        .limit(1);

      if (dealData && dealData.closerId === user.id) {
        // User is the Closer on this deal, so they can see the Setter commission (transparency)
        return true;
      }
    } catch (error) {
      console.error("Error checking closer transparency:", error);
    }
  }

  // User is in the management chain
  if (commission.reportsToId === user.id) {
    return true;
  }

  // Admin and Regional Manager can see all
  if (
    hasPermission(user, Permission.MANAGE_OWN_REGION) ||
    hasPermission(user, Permission.VIEW_ALL_PEOPLE)
  ) {
    return true;
  }

  // For office managers and team leads, need to check office membership
  if (
    hasPermission(user, Permission.MANAGE_OWN_OFFICE) ||
    hasPermission(user, Permission.MANAGE_OWN_TEAM)
  ) {
    try {
      const commissionPerson = await db
        .select()
        .from(people)
        .where(eq(people.id, commission.personId))
        .limit(1);

      if (!commissionPerson[0]) {
        return false;
      }

      const person = commissionPerson[0];

      // Office Manager: allow only when commission belongs to someone in the same office
      if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
        return person.officeId === user.officeId;
      }

      // Team Lead: allow only when commission belongs to their direct report or same office
      if (hasPermission(user, Permission.MANAGE_OWN_TEAM)) {
        return (
          person.officeId === user.officeId ||
          person.reportsToId === user.id
        );
      }
    } catch (error) {
      console.error("Error checking commission visibility:", error);
      return false;
    }
  }

  // Otherwise deny
  return false;
}

/**
 * Get all commissions for a specific deal that the user can view.
 * 
 * For Closers: returns both their Closer commission AND the Setter commission on the same deal (for transparency).
 * For Setters: returns only their Setter commission.
 * For Leaders: returns all commissions for the deal.
 * 
 * @param user - The current user object
 * @param dealId - The deal ID
 * @returns Promise resolving to array of commission IDs the user can view
 */
export async function getCommissionsForDeal(
  dealId: string,
  userId: string
): Promise<any[]> {
  try {
    // Fetch the deal to get setter and closer IDs
    const [dealData] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId))
      .limit(1);

    if (!dealData) {
      return [];
    }

    // Fetch all commissions for this deal with person metadata
    const allCommissions = await db
      .select({
        commission: commissions,
        person: {
          id: people.id,
          firstName: people.firstName,
          lastName: people.lastName,
        },
      })
      .from(commissions)
      .innerJoin(people, eq(commissions.personId, people.id))
      .where(eq(commissions.dealId, dealId));

    // Get user with role to check permissions
    const [userData] = await db
      .select({
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
        roleId: people.roleId,
        roleName: roles.name,
        roleLevel: roles.level,
        officeId: people.officeId,
        reportsToId: people.reportsToId,
        recruitedById: people.recruitedById,
        status: people.status,
      })
      .from(people)
      .innerJoin(roles, eq(people.roleId, roles.id))
      .where(eq(people.id, userId))
      .limit(1);

    if (!userData) {
      return [];
    }

    // Check user permissions
    const isAdmin = hasPermission(userData, Permission.VIEW_ALL_PEOPLE);
    const isLeader =
      hasPermission(userData, Permission.MANAGE_OWN_OFFICE) ||
      hasPermission(userData, Permission.MANAGE_OWN_TEAM);

    // Admin/Leaders: return all commissions
    if (isAdmin || isLeader) {
      return allCommissions.map((c) => ({
        ...c.commission,
        person: c.person,
      }));
    }

    // Check if user is the Setter
    const isSetter = dealData.setterId === userId;

    // Check if user is the Closer
    const isCloser = dealData.closerId === userId;

    // Setter: return only their Setter commission
    if (isSetter && !isCloser) {
      return allCommissions
        .filter(
          (c) => c.commission.personId === userId && c.commission.commissionType === "setter"
        )
        .map((c) => ({
          ...c.commission,
          person: c.person,
        }));
    }

    // Closer: return their Closer commission AND the Setter commission (for transparency)
    if (isCloser) {
      return allCommissions
        .filter(
          (c) =>
            (c.commission.personId === userId && c.commission.commissionType === "closer") ||
            (c.commission.personId === dealData.setterId && c.commission.commissionType === "setter")
        )
        .map((c) => ({
          ...c.commission,
          person: c.person,
        }));
    }

    // Self-gen: return only their self_gen commission
    if (isSetter && isCloser) {
      return allCommissions
        .filter(
          (c) => c.commission.personId === userId && c.commission.commissionType === "self_gen"
        )
        .map((c) => ({
          ...c.commission,
          person: c.person,
        }));
    }

    // Otherwise, return only commissions where user is the recipient
    return allCommissions
      .filter((c) => c.commission.personId === userId)
      .map((c) => ({
        ...c.commission,
        person: c.person,
      }));
  } catch (error) {
    console.error("Error getting commissions for deal:", error);
    return [];
  }
}

/**
 * Get visibility filter conditions for commission queries based on user role and tab.
 * 
 * @param user - The current user object
 * @param tab - The tab type: "my-deals", "team" (same scope as deals list), or "overrides"
 * @returns Filter conditions object, or null for no restrictions
 */
export function getCommissionVisibilityFilter(
  user: NonNullable<CurrentUser>,
  tab: string
): {
  personId?: string;
  officeId?: string;
  commissionTypes?: string[];
} | null {
  // Admin and Regional Manager can see all
  if (
    hasPermission(user, Permission.VIEW_ALL_PEOPLE) ||
    hasPermission(user, Permission.MANAGE_OWN_REGION)
  ) {
    return null; // No filter
  }

  // "team" tab: same visibility scope as /api/deals (team/office/all)
  if (tab === "team") {
    const dealFilter = getDealVisibilityFilter(user);
    if (!dealFilter) return null;
    if (dealFilter.officeId) return { officeId: dealFilter.officeId };
    if (dealFilter.setterId) return { personId: dealFilter.setterId };
    if (dealFilter.id) return { personId: dealFilter.id };
    return null;
  }

  // For "my-deals" tab
  if (tab === "my-deals") {
    // Office Manager: filter by office
    if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
      if (!user.officeId) {
        return { personId: user.id }; // Fallback to own commissions
      }
      return { officeId: user.officeId };
    }

    // Team Lead: filter by office or reports to them
    if (hasPermission(user, Permission.MANAGE_OWN_TEAM)) {
      if (!user.officeId) {
        return { personId: user.id }; // Fallback to own commissions
      }
      return { officeId: user.officeId };
    }

    // Sales Rep: only own commissions
    return { personId: user.id };
  }

  // For "overrides" tab
  if (tab === "overrides") {
    // Office Manager: filter by office
    if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
      if (!user.officeId) {
        return { personId: user.id, commissionTypes: ["override_reports_to_l1", "override_reports_to_l2", "override_recruited_by_l1", "override_recruited_by_l2"] };
      }
      return { officeId: user.officeId, commissionTypes: ["override_reports_to_l1", "override_reports_to_l2", "override_recruited_by_l1", "override_recruited_by_l2"] };
    }

    // Team Lead: filter by office or reports to them
    if (hasPermission(user, Permission.MANAGE_OWN_TEAM)) {
      if (!user.officeId) {
        return { personId: user.id, commissionTypes: ["override_reports_to_l1", "override_reports_to_l2", "override_recruited_by_l1", "override_recruited_by_l2"] };
      }
      return { officeId: user.officeId, commissionTypes: ["override_reports_to_l1", "override_reports_to_l2", "override_recruited_by_l1", "override_recruited_by_l2"] };
    }

    // Sales Rep: only own override commissions
    return { personId: user.id, commissionTypes: ["override_reports_to_l1", "override_reports_to_l2", "override_recruited_by_l1", "override_recruited_by_l2"] };
  }

  // Default: only own commissions
  return { personId: user.id };
}

/**
 * Check if a user can view a specific recruit.
 * 
 * @param user - The current user object
 * @param recruit - The recruit object to check
 * @returns Promise resolving to true if user can view, false otherwise
 */
export async function canViewRecruit(
  user: NonNullable<CurrentUser>,
  recruit: { recruiterId: string; targetOfficeId?: string | null }
): Promise<boolean> {
  // Admin and Regional Manager can see all
  if (
    hasPermission(user, Permission.VIEW_ALL_PEOPLE) ||
    hasPermission(user, Permission.MANAGE_OWN_REGION)
  ) {
    return true;
  }

  // Recruiters see their own recruits
  if (recruit.recruiterId === user.id) {
    return true;
  }

  // Office Manager: check if recruit targets their office
  if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
    if (!user.officeId) {
      return false;
    }
    return recruit.targetOfficeId === user.officeId;
  }

  // Team Lead: check if recruit targets their office
  if (hasPermission(user, Permission.MANAGE_OWN_TEAM)) {
    if (!user.officeId) {
      return false;
    }
    return recruit.targetOfficeId === user.officeId;
  }

  // Sales Rep: only their own recruits
  return false;
}

/**
 * Check if a user can manage a specific recruit.
 * 
 * @param user - The current user object
 * @param recruitId - The ID of the recruit to check access for
 * @returns Promise resolving to true if user can manage, false otherwise
 */
export async function canManageRecruit(
  user: NonNullable<CurrentUser>,
  recruitId: string
): Promise<boolean> {
  // Admin with MANAGE_ALL_OFFICES can manage anyone
  if (hasPermission(user, Permission.MANAGE_ALL_OFFICES)) {
    return true;
  }

  // Regional Manager with MANAGE_OWN_REGION can manage anyone in their region
  if (hasPermission(user, Permission.MANAGE_OWN_REGION)) {
    return true;
  }

  try {
    const targetRecruit = await db
      .select()
      .from(recruits)
      .where(eq(recruits.id, recruitId))
      .limit(1);

    if (!targetRecruit[0]) {
      return false;
    }

    const recruit = targetRecruit[0];

    // Recruiters can manage their own recruits
    if (recruit.recruiterId === user.id) {
      return true;
    }

    // Office Manager: can manage recruits targeting their office
    if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
      if (!user.officeId) {
        return false;
      }
      return recruit.targetOfficeId === user.officeId;
    }

    // Team Lead: can manage recruits targeting their office
    if (hasPermission(user, Permission.MANAGE_OWN_TEAM)) {
      if (!user.officeId) {
        return false;
      }
      return recruit.targetOfficeId === user.officeId;
    }

    // Sales Rep: can only manage their own recruits
    return false;
  } catch (error) {
    console.error("Error checking recruit management access:", error);
    return false;
  }
}

/**
 * Get visibility filter conditions for recruit queries based on role.
 * 
 * @param user - The current user object
 * @returns Filter conditions object, or null for no restrictions
 */
export function getRecruitVisibilityFilter(user: NonNullable<CurrentUser>) {
  // Admin and Regional Manager can see all
  if (
    hasPermission(user, Permission.VIEW_ALL_PEOPLE) ||
    hasPermission(user, Permission.MANAGE_OWN_REGION)
  ) {
    return null; // No filter
  }

  // Office Manager: filter by target office
  if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
    if (!user.officeId) {
      return { recruiterId: user.id }; // Fallback to own recruits if no office
    }
    return { targetOfficeId: user.officeId };
  }

  // Team Lead: filter by target office
  if (hasPermission(user, Permission.MANAGE_OWN_TEAM)) {
    if (!user.officeId) {
      return { recruiterId: user.id }; // Fallback to own recruits
    }
    return { targetOfficeId: user.officeId };
  }

  // Recruiters/Sales Rep: only own recruits
  return { recruiterId: user.id };
}

/**
 * Get visibility filter conditions for deal queries based on role.
 * 
 * @param user - The current user object
 * @returns Filter conditions object, or null for no restrictions
 */
export function getDealVisibilityFilter(user: NonNullable<CurrentUser>) {
  // Admin and Regional Manager can see all
  if (
    hasPermission(user, Permission.VIEW_ALL_PEOPLE) ||
    hasPermission(user, Permission.MANAGE_OWN_REGION)
  ) {
    return null; // No filter
  }

  // Office Manager: filter by office
  if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
    if (!user.officeId) {
      return { setterId: user.id }; // Fallback to own deals if no office
    }
    return { officeId: user.officeId };
  }

  // Team Lead: filter by office
  if (hasPermission(user, Permission.MANAGE_OWN_TEAM)) {
    if (!user.officeId) {
      return { setterId: user.id }; // Fallback to own deals
    }
    return { officeId: user.officeId };
  }

  // Sales Rep: only own deals (as setter or closer)
  return { setterId: user.id };
}

/**
 * Apply visibility filter to a commission query.
 * 
 * This is a helper for building Drizzle queries with proper filtering.
 * 
 * @param user - The current user object
 * @param query - The Drizzle query builder
 * @returns Query with visibility filters applied
 */
export function applyCommissionVisibilityFilter(
  user: NonNullable<CurrentUser>,
  query: any
) {
  // Sales Rep: only their own commissions
  if (hasPermission(user, Permission.VIEW_OWN_DATA_ONLY)) {
    return query.where(eq(people.id, user.id));
  }

  // Team Lead/Office Manager: their team/office commissions
  if (
    hasPermission(user, Permission.MANAGE_OWN_TEAM) ||
    hasPermission(user, Permission.MANAGE_OWN_OFFICE)
  ) {
    if (!user.officeId) {
      return query.where(eq(people.id, user.id));
    }
    return query.where(
      or(
        eq(people.officeId, user.officeId),
        eq(people.reportsToId, user.id)
      )
    );
  }

  // Admin/Regional Manager: all commissions (no filter)
  return query;
}
