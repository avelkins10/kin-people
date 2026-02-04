import { db } from "@/lib/db";
import { people, recruits, deals, commissions, roles, offices } from "@/lib/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";
import type { CurrentUser } from "./get-current-user";
import { Permission } from "@/lib/permissions/types";
import { hasPermission } from "./check-permission";
import { getDocumentWithDetails } from "@/lib/db/helpers/document-helpers";
import {
  getVisibilityScope,
  getManagedRegionId,
  getOfficeIdsInRegion,
  type VisibilityScope,
} from "@/lib/db/helpers/person-helpers";

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
  // Admin can see all
  if (hasPermission(user, Permission.VIEW_ALL_PEOPLE)) {
    return null; // No filter
  }

  // Regional Manager: will need async check for region-based filtering
  // Note: For sync version, we still allow MANAGE_OWN_REGION to see all
  // The async version (getVisibilityFilterAsync) should be used for proper hierarchy checks
  if (hasPermission(user, Permission.MANAGE_OWN_REGION)) {
    return null; // No filter - async version handles proper region filtering
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
 * Get visibility filter using the organizational hierarchy (async version).
 *
 * Uses the proper hierarchy:
 * - Regional Manager → All offices in their region
 * - Area Director → Their office
 * - Team Lead → Their team members
 * - Sales Rep → Own data only
 *
 * @param user - The current user object
 * @returns Promise resolving to filter conditions or null for no restrictions
 */
export async function getVisibilityFilterAsync(user: NonNullable<CurrentUser>): Promise<{
  type: 'all' | 'offices' | 'office' | 'team' | 'self';
  officeIds?: string[];
  personIds?: string[];
} | null> {
  // Admin can see all
  if (hasPermission(user, Permission.VIEW_ALL_PEOPLE)) {
    return null;
  }

  // Get hierarchy-based visibility scope
  const scope = await getVisibilityScope(user.id, user.officeId);

  switch (scope.type) {
    case 'region':
      return { type: 'offices', officeIds: scope.officeIds };
    case 'office':
      return { type: 'office', officeIds: scope.officeIds };
    case 'team':
      return { type: 'team', personIds: scope.personIds };
    case 'self':
      return { type: 'self', personIds: [user.id] };
    default:
      return { type: 'self', personIds: [user.id] };
  }
}

/**
 * Check if a user can view a specific person using organizational hierarchy.
 *
 * Hierarchy-based visibility:
 * - Admin → All people
 * - Regional Manager → All people in offices within their region
 * - Area Director → All people in their office
 * - Team Lead → All people in their team
 * - Sales Rep → Only themselves
 *
 * @param user - The current user object
 * @param targetPersonId - The ID of the person to check access for
 * @returns Promise resolving to true if user can view, false otherwise
 */
export async function canViewPerson(
  user: NonNullable<CurrentUser>,
  targetPersonId: string
): Promise<boolean> {
  // Admin can see all
  if (hasPermission(user, Permission.VIEW_ALL_PEOPLE)) {
    return true;
  }

  // If checking own record, always allowed
  if (user.id === targetPersonId) {
    return true;
  }

  try {
    // Get user's visibility scope based on hierarchy
    const scope = await getVisibilityScope(user.id, user.officeId);

    // Fetch target person
    const targetPerson = await db
      .select()
      .from(people)
      .where(eq(people.id, targetPersonId))
      .limit(1);

    if (!targetPerson[0]) {
      return false;
    }

    const person = targetPerson[0];

    switch (scope.type) {
      case 'region':
        // Regional Manager: check if person's office is in the region
        return scope.officeIds?.includes(person.officeId ?? '') ?? false;

      case 'office':
        // Area Director: check if person is in the same office
        return scope.officeIds?.includes(person.officeId ?? '') ?? false;

      case 'team':
        // Team Lead: check if person is in their team
        return scope.personIds?.includes(person.id) ?? false;

      case 'self':
        // Sales Rep: only own data (already checked above)
        return false;

      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking person visibility:", error);
    return false;
  }
}

/**
 * Check if a user can manage a specific person based on organizational hierarchy.
 *
 * Hierarchy-based management:
 * - Admin (MANAGE_ALL_OFFICES) → Can manage anyone
 * - Regional Manager → Can manage anyone in offices within their region
 * - Area Director → Can manage anyone in their office
 * - Team Lead → Can manage their direct reports (team members)
 * - Sales Rep → Can only manage themselves
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

  // If checking own record, always allowed
  if (user.id === targetPersonId) {
    return true;
  }

  try {
    // Get user's visibility scope based on hierarchy
    const scope = await getVisibilityScope(user.id, user.officeId);

    const targetPerson = await db
      .select()
      .from(people)
      .where(eq(people.id, targetPersonId))
      .limit(1);

    if (!targetPerson[0]) {
      return false;
    }

    const person = targetPerson[0];

    switch (scope.type) {
      case 'region':
        // Regional Manager: can manage anyone in their region's offices
        return scope.officeIds?.includes(person.officeId ?? '') ?? false;

      case 'office':
        // Area Director: can manage anyone in their office
        return scope.officeIds?.includes(person.officeId ?? '') ?? false;

      case 'team':
        // Team Lead: can manage their team members
        return scope.personIds?.includes(person.id) ?? false;

      case 'self':
        // Sales Rep: can only manage themselves (already checked above)
        return false;

      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking person management access:", error);
    return false;
  }
}

/**
 * Check if a user can view a specific commission using organizational hierarchy.
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

  // Admin can see all
  if (hasPermission(user, Permission.VIEW_ALL_PEOPLE)) {
    return true;
  }

  try {
    // Get user's visibility scope based on hierarchy
    const scope = await getVisibilityScope(user.id, user.officeId);

    // Fetch the commission recipient's data
    const commissionPerson = await db
      .select()
      .from(people)
      .where(eq(people.id, commission.personId))
      .limit(1);

    if (!commissionPerson[0]) {
      return false;
    }

    const person = commissionPerson[0];

    switch (scope.type) {
      case 'region':
        // Regional Manager: can view commissions for anyone in their region's offices
        return scope.officeIds?.includes(person.officeId ?? '') ?? false;

      case 'office':
        // Area Director: can view commissions for anyone in their office
        return scope.officeIds?.includes(person.officeId ?? '') ?? false;

      case 'team':
        // Team Lead: can view commissions for their team members
        return scope.personIds?.includes(person.id) ?? false;

      case 'self':
        // Sales Rep: only own commissions (already checked above)
        return false;

      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking commission visibility:", error);
    return false;
  }
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
 * Note: This is the sync version. For proper hierarchy-based filtering,
 * use getCommissionVisibilityFilterAsync instead.
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
  // Admin can see all
  if (hasPermission(user, Permission.VIEW_ALL_PEOPLE)) {
    return null; // No filter
  }

  // Regional Manager: still returns null for sync version
  // Async version handles proper region filtering
  if (hasPermission(user, Permission.MANAGE_OWN_REGION)) {
    return null;
  }

  // "team" tab: same visibility scope as /api/deals (team/office/all)
  if (tab === "team") {
    const dealFilter = getDealVisibilityFilter(user);
    if (!dealFilter) return null;
    if (dealFilter.officeId) return { officeId: dealFilter.officeId };
    if (dealFilter.setterId) return { personId: dealFilter.setterId };
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
 * Get visibility filter for commission queries using organizational hierarchy (async version).
 *
 * @param user - The current user object
 * @param tab - The tab type: "my-deals", "team", or "overrides"
 * @returns Promise resolving to filter conditions or null for no restrictions
 */
export async function getCommissionVisibilityFilterAsync(
  user: NonNullable<CurrentUser>,
  tab: string
): Promise<{
  personId?: string;
  officeIds?: string[];
  personIds?: string[];
  commissionTypes?: string[];
} | null> {
  // Admin can see all
  if (hasPermission(user, Permission.VIEW_ALL_PEOPLE)) {
    return null;
  }

  const overrideTypes = [
    "override_reports_to_l1",
    "override_reports_to_l2",
    "override_recruited_by_l1",
    "override_recruited_by_l2",
  ];

  // Get hierarchy-based visibility scope
  const scope = await getVisibilityScope(user.id, user.officeId);

  // Build base filter from scope
  let baseFilter: { officeIds?: string[]; personIds?: string[]; personId?: string } = {};

  switch (scope.type) {
    case 'region':
      baseFilter = { officeIds: scope.officeIds };
      break;
    case 'office':
      baseFilter = { officeIds: scope.officeIds };
      break;
    case 'team':
      baseFilter = { personIds: scope.personIds };
      break;
    case 'self':
      baseFilter = { personId: user.id };
      break;
  }

  // Apply tab-specific modifications
  if (tab === "overrides") {
    return { ...baseFilter, commissionTypes: overrideTypes };
  }

  return baseFilter;
}

/**
 * Check if a user can view a specific recruit using organizational hierarchy.
 *
 * @param user - The current user object
 * @param recruit - The recruit object to check
 * @returns Promise resolving to true if user can view, false otherwise
 */
export async function canViewRecruit(
  user: NonNullable<CurrentUser>,
  recruit: { recruiterId: string; targetOfficeId?: string | null }
): Promise<boolean> {
  // Admin can see all
  if (hasPermission(user, Permission.VIEW_ALL_PEOPLE)) {
    return true;
  }

  // Recruiters always see their own recruits
  if (recruit.recruiterId === user.id) {
    return true;
  }

  try {
    // Get user's visibility scope based on hierarchy
    const scope = await getVisibilityScope(user.id, user.officeId);

    switch (scope.type) {
      case 'region':
        // Regional Manager: can view recruits targeting any office in their region
        return scope.officeIds?.includes(recruit.targetOfficeId ?? '') ?? false;

      case 'office':
        // Area Director: can view recruits targeting their office
        return scope.officeIds?.includes(recruit.targetOfficeId ?? '') ?? false;

      case 'team':
        // Team Lead: can view recruits targeting their office (via their team's office)
        // Get the office from the team
        if (scope.officeIds && scope.officeIds.length > 0) {
          return scope.officeIds.includes(recruit.targetOfficeId ?? '');
        }
        // Fallback: use user's office
        return recruit.targetOfficeId === user.officeId;

      case 'self':
        // Sales Rep: only their own recruits (already checked above)
        return false;

      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking recruit visibility:", error);
    return false;
  }
}

/**
 * Check if a user can manage a specific recruit using organizational hierarchy.
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

    // Get user's visibility scope based on hierarchy
    const scope = await getVisibilityScope(user.id, user.officeId);

    switch (scope.type) {
      case 'region':
        // Regional Manager: can manage recruits targeting any office in their region
        return scope.officeIds?.includes(recruit.targetOfficeId ?? '') ?? false;

      case 'office':
        // Area Director: can manage recruits targeting their office
        return scope.officeIds?.includes(recruit.targetOfficeId ?? '') ?? false;

      case 'team':
        // Team Lead: can manage recruits targeting their office
        if (scope.officeIds && scope.officeIds.length > 0) {
          return scope.officeIds.includes(recruit.targetOfficeId ?? '');
        }
        return recruit.targetOfficeId === user.officeId;

      case 'self':
        // Sales Rep: can only manage their own recruits (already checked above)
        return false;

      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking recruit management access:", error);
    return false;
  }
}

/**
 * Check if a user can send a document to a specific recruit.
 * Allowed: recruiter (owner of the recruit), admin (MANAGE_ALL_OFFICES), office manager (MANAGE_OWN_OFFICE).
 * MANAGE_OWN_TEAM and MANAGE_OWN_REGION are not allowed unless explicitly added later.
 *
 * @param user - The current user object
 * @param recruitId - The ID of the recruit to check access for
 * @returns Promise resolving to true if user can send document, false otherwise
 */
export async function canSendDocumentToRecruit(
  user: NonNullable<CurrentUser>,
  recruitId: string
): Promise<boolean> {
  if (hasPermission(user, Permission.MANAGE_ALL_OFFICES)) {
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

    if (recruit.recruiterId === user.id) {
      return true;
    }

    if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
      if (!user.officeId) {
        return false;
      }
      return recruit.targetOfficeId === user.officeId;
    }

    return false;
  } catch (error) {
    console.error("Error checking can send document to recruit:", error);
    return false;
  }
}

/**
 * Check if a user can send a document to a specific person.
 *
 * @param user - The current user object
 * @param personId - The ID of the person to check access for
 * @returns Promise resolving to true if user can send document, false otherwise
 */
export async function canSendDocumentToPerson(
  user: NonNullable<CurrentUser>,
  personId: string
): Promise<boolean> {
  if (hasPermission(user, Permission.MANAGE_ALL_OFFICES)) {
    return true;
  }
  if (hasPermission(user, Permission.MANAGE_OWN_REGION)) {
    return true;
  }

  if (user.id === personId) {
    return true;
  }

  try {
    const targetPerson = await db
      .select()
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);

    if (!targetPerson[0]) {
      return false;
    }

    const person = targetPerson[0];

    if (hasPermission(user, Permission.MANAGE_OWN_OFFICE)) {
      if (!user.officeId) {
        return false;
      }
      return person.officeId === user.officeId;
    }

    if (hasPermission(user, Permission.MANAGE_OWN_TEAM)) {
      return person.reportsToId === user.id || person.officeId === user.officeId;
    }

    return false;
  } catch (error) {
    console.error("Error checking can send document to person:", error);
    return false;
  }
}

/**
 * Check if a user can view a specific document.
 *
 * @param user - The current user object
 * @param documentId - The ID of the document to check access for
 * @returns Promise resolving to true if user can view, false otherwise
 */
export async function canViewDocument(
  user: NonNullable<CurrentUser>,
  documentId: string
): Promise<boolean> {
  if (
    hasPermission(user, Permission.VIEW_ALL_PEOPLE) ||
    hasPermission(user, Permission.MANAGE_OWN_REGION)
  ) {
    return true;
  }

  try {
    const docWithDetails = await getDocumentWithDetails(documentId);
    if (!docWithDetails) {
      return false;
    }

    const { document } = docWithDetails;

    if (document.recruitId) {
      const [fullRecruit] = await db
        .select()
        .from(recruits)
        .where(eq(recruits.id, document.recruitId))
        .limit(1);
      if (!fullRecruit) {
        return false;
      }
      return canViewRecruit(user, {
        recruiterId: fullRecruit.recruiterId,
        targetOfficeId: fullRecruit.targetOfficeId,
      });
    }

    if (document.personId) {
      return canViewPerson(user, document.personId);
    }

    return false;
  } catch (error) {
    console.error("Error checking document visibility:", error);
    return false;
  }
}

/**
 * Check if a user can manage document templates.
 *
 * @param user - The current user object
 * @returns true if user can manage templates, false otherwise
 */
export function canManageTemplates(user: NonNullable<CurrentUser>): boolean {
  return hasPermission(user, Permission.MANAGE_SETTINGS);
}

/**
 * Get visibility filter conditions for recruit queries based on role.
 *
 * Note: This is the sync version. For proper hierarchy-based filtering,
 * use getRecruitVisibilityFilterAsync instead.
 *
 * @param user - The current user object
 * @returns Filter conditions object, or null for no restrictions
 */
export function getRecruitVisibilityFilter(user: NonNullable<CurrentUser>) {
  // Admin can see all
  if (hasPermission(user, Permission.VIEW_ALL_PEOPLE)) {
    return null; // No filter
  }

  // Regional Manager: still returns null for sync version
  // Async version handles proper region filtering
  if (hasPermission(user, Permission.MANAGE_OWN_REGION)) {
    return null;
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
 * Get visibility filter for recruit queries using organizational hierarchy (async version).
 *
 * @param user - The current user object
 * @returns Promise resolving to filter conditions or null for no restrictions
 */
export async function getRecruitVisibilityFilterAsync(user: NonNullable<CurrentUser>): Promise<{
  recruiterId?: string;
  targetOfficeId?: string;
  targetOfficeIds?: string[];
} | null> {
  // Admin can see all
  if (hasPermission(user, Permission.VIEW_ALL_PEOPLE)) {
    return null;
  }

  // Get hierarchy-based visibility scope
  const scope = await getVisibilityScope(user.id, user.officeId);

  switch (scope.type) {
    case 'region':
      // Regional Manager: filter by offices in their region
      return { targetOfficeIds: scope.officeIds };

    case 'office':
      // Area Director: filter by their office
      return { targetOfficeId: scope.officeIds?.[0] };

    case 'team':
      // Team Lead: filter by their office
      return { targetOfficeId: user.officeId ?? undefined };

    case 'self':
      // Sales Rep: only own recruits
      return { recruiterId: user.id };

    default:
      return { recruiterId: user.id };
  }
}

/**
 * Get visibility filter conditions for deal queries based on role.
 *
 * Note: This is the sync version. For proper hierarchy-based filtering,
 * use getDealVisibilityFilterAsync instead.
 *
 * @param user - The current user object
 * @returns Filter conditions object, or null for no restrictions
 */
export function getDealVisibilityFilter(user: NonNullable<CurrentUser>) {
  // Admin can see all
  if (hasPermission(user, Permission.VIEW_ALL_PEOPLE)) {
    return null; // No filter
  }

  // Regional Manager: still returns null for sync version
  // Async version handles proper region filtering
  if (hasPermission(user, Permission.MANAGE_OWN_REGION)) {
    return null;
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
 * Get visibility filter for deal queries using organizational hierarchy (async version).
 *
 * @param user - The current user object
 * @returns Promise resolving to filter conditions or null for no restrictions
 */
export async function getDealVisibilityFilterAsync(user: NonNullable<CurrentUser>): Promise<{
  setterId?: string;
  officeId?: string;
  officeIds?: string[];
} | null> {
  // Admin can see all
  if (hasPermission(user, Permission.VIEW_ALL_PEOPLE)) {
    return null;
  }

  // Get hierarchy-based visibility scope
  const scope = await getVisibilityScope(user.id, user.officeId);

  switch (scope.type) {
    case 'region':
      // Regional Manager: filter by offices in their region
      return { officeIds: scope.officeIds };

    case 'office':
      // Area Director: filter by their office
      return { officeId: scope.officeIds?.[0] };

    case 'team':
      // Team Lead: filter by their office
      return { officeId: user.officeId ?? undefined };

    case 'self':
      // Sales Rep: only own deals (as setter or closer)
      return { setterId: user.id };

    default:
      return { setterId: user.id };
  }
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
