"use client";

import { useEffect, useState } from "react";

interface UserData {
  user: {
    roleName: string;
  };
  permissions: string[];
}

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client component that conditionally renders children based on user role.
 * 
 * Fetches current user from /api/auth/me and checks if their role is in the allowed roles list.
 * 
 * @example
 * ```tsx
 * <RoleGuard allowedRoles={["Admin", "Regional Manager"]}>
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data: UserData = await response.json();
          setHasRole(allowedRoles.includes(data.user.roleName));
        }
      } catch (error) {
        console.error("Error checking role:", error);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    }

    checkRole();
  }, [allowedRoles]);

  if (loading) {
    return null;
  }

  return hasRole ? <>{children}</> : <>{fallback}</>;
}
