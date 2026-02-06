import { Permission, type RolePermissions } from "./types";

/**
 * Role-based permissions matrix — single source of truth.
 * Maps each role to its allowed permissions.
 *
 * Hierarchy (low → high): Sales Rep → Team Lead → Area Director → Regional Manager → Divisional → VP → Admin
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  Admin: [
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_ALL_OFFICES,
    Permission.MANAGE_OWN_REGION,
    Permission.MANAGE_OWN_OFFICE,
    Permission.MANAGE_OWN_TEAM,
    Permission.VIEW_ALL_PEOPLE,
    Permission.VIEW_OWN_OFFICE_PEOPLE,
    Permission.VIEW_OWN_TEAM,
    Permission.CREATE_RECRUITS,
    Permission.CREATE_DEALS,
    Permission.EDIT_DEALS,
    Permission.DELETE_DEALS,
    Permission.APPROVE_COMMISSIONS,
    Permission.RUN_PAYROLL,
    Permission.VIEW_OWN_DATA_ONLY,
  ],
  VP: [
    Permission.MANAGE_OWN_REGION,
    Permission.VIEW_ALL_PEOPLE,
    Permission.VIEW_OWN_OFFICE_PEOPLE,
    Permission.VIEW_OWN_TEAM,
    Permission.CREATE_RECRUITS,
    Permission.CREATE_DEALS,
    Permission.EDIT_DEALS,
    Permission.APPROVE_COMMISSIONS,
  ],
  Divisional: [
    Permission.MANAGE_OWN_REGION,
    Permission.VIEW_ALL_PEOPLE,
    Permission.VIEW_OWN_OFFICE_PEOPLE,
    Permission.VIEW_OWN_TEAM,
    Permission.CREATE_RECRUITS,
    Permission.CREATE_DEALS,
    Permission.EDIT_DEALS,
    Permission.APPROVE_COMMISSIONS,
  ],
  "Regional Manager": [
    Permission.MANAGE_OWN_REGION,
    Permission.VIEW_ALL_PEOPLE,
    Permission.VIEW_OWN_OFFICE_PEOPLE,
    Permission.VIEW_OWN_TEAM,
    Permission.CREATE_RECRUITS,
    Permission.CREATE_DEALS,
    Permission.EDIT_DEALS,
    Permission.APPROVE_COMMISSIONS,
  ],
  "Area Director": [
    Permission.MANAGE_OWN_OFFICE,
    Permission.VIEW_OWN_OFFICE_PEOPLE,
    Permission.VIEW_OWN_TEAM,
    Permission.CREATE_RECRUITS,
    Permission.CREATE_DEALS,
    Permission.EDIT_DEALS,
    Permission.APPROVE_COMMISSIONS,
  ],
  "Team Lead": [
    Permission.MANAGE_OWN_TEAM,
    Permission.VIEW_OWN_OFFICE_PEOPLE,
    Permission.VIEW_OWN_TEAM,
    Permission.CREATE_RECRUITS,
    Permission.CREATE_DEALS,
    Permission.EDIT_DEALS,
  ],
  "Sales Rep": [
    Permission.VIEW_OWN_DATA_ONLY,
    Permission.CREATE_RECRUITS,
    Permission.CREATE_DEALS,
  ],
};

/**
 * Get permissions for a specific role.
 * @param roleName - The name of the role
 * @returns Array of permissions for the role, or empty array if role not found
 */
export function getRolePermissions(roleName: string): Permission[] {
  return ROLE_PERMISSIONS[roleName] || [];
}
