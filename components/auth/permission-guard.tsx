"use client";

import { useEffect, useState } from "react";
import { Permission } from "@/lib/permissions/types";

interface UserData {
  user: {
    roleName: string;
  };
  permissions: string[];
}

interface PermissionGuardProps {
  /** Single required permission */
  permission?: Permission;
  /** Any of these permissions (takes precedence if both permission and permissions are set) */
  permissions?: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client component that conditionally renders children based on user permissions.
 * 
 * Fetches current user from /api/auth/me and checks if they have the required permission.
 * 
 * @example
 * ```tsx
 * <PermissionGuard permission={Permission.APPROVE_COMMISSIONS}>
 *   <ApproveButton />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permission,
  permissions,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data: UserData = await response.json();
          const userPerms = data.permissions || [];
          if (permissions?.length) {
            setHasPermission(permissions.some((p) => userPerms.includes(p)));
          } else if (permission) {
            setHasPermission(userPerms.includes(permission));
          } else {
            setHasPermission(false);
          }
        }
      } catch (error) {
        console.error("Error checking permission:", error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [permission, permissions ? permissions.join(",") : undefined]);

  if (loading) {
    return null;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
