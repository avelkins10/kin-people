import { useQuery } from "@tanstack/react-query";
import type { Permission } from "@/lib/permissions/types";

export interface CurrentUser {
  id: string;
  email: string;
  roleName: string;
  permissions: Permission[];
}

/**
 * Hook to fetch current authenticated user with permissions.
 * Used for checking permissions in UI components.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        throw new Error("Failed to fetch current user");
      }
      const data = await response.json();
      return {
        user: data.user,
        permissions: data.permissions ?? [],
      };
    },
    staleTime: 5 * 60 * 1000, // User data rarely changes, cache for 5 minutes
  });
}
