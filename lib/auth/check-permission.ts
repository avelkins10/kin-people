import { Permission } from "@/lib/permissions/types";
import { getRolePermissions } from "@/lib/permissions/roles";
import type { CurrentUser } from "./get-current-user";

/**
 * Check if a user has a specific permission.
 * 
 * @param user - The current user object (from getCurrentUser)
 * @param permission - The permission to check
 * @returns true if user has the permission, false otherwise
 */
export function hasPermission(
  user: NonNullable<CurrentUser>,
  permission: Permission
): boolean {
  if (!user?.roleName) {
    return false;
  }

  const rolePermissions = getRolePermissions(user.roleName);
  return rolePermissions.includes(permission);
}

/**
 * Require a specific permission, throwing an error if the user doesn't have it.
 * 
 * Used in API routes for authorization checks.
 * 
 * @param user - The current user object (from getCurrentUser)
 * @param permission - The permission to require
 * @throws Error with 403 status if permission denied
 */
export function requirePermission(
  user: NonNullable<CurrentUser>,
  permission: Permission
): void {
  if (!hasPermission(user, permission)) {
    const error = new Error("Permission denied");
    (error as any).status = 403;
    throw error;
  }
}
