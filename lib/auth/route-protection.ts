import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./get-current-user";
import { requirePermission } from "./check-permission";
import { Permission } from "@/lib/permissions/types";
import type { CurrentUser } from "./get-current-user";

type RouteHandler = (
  req: NextRequest,
  user: NonNullable<CurrentUser>
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function to protect API routes with authentication.
 * 
 * Wraps an API route handler to ensure the user is authenticated.
 * Returns 401 if not authenticated.
 * 
 * @param handler - The route handler function
 * @returns Wrapped handler that includes user authentication
 * 
 * @example
 * ```ts
 * export const GET = withAuth(async (req, user) => {
 *   return NextResponse.json({ user });
 * });
 * ```
 */
export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest) => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      return await handler(req, user);
    } catch (error: any) {
      console.error("Auth error:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: error.status || 500 }
      );
    }
  };
}

/**
 * Higher-order function to protect API routes with permission checks.
 * 
 * Wraps an API route handler to ensure the user is authenticated AND
 * has the required permission. Returns 401 if not authenticated,
 * 403 if permission denied.
 * 
 * @param permission - The required permission
 * @param handler - The route handler function
 * @returns Wrapped handler that includes authentication and permission checks
 * 
 * @example
 * ```ts
 * export const GET = withPermission(
 *   Permission.VIEW_ALL_PEOPLE,
 *   async (req, user) => {
 *     // Handler code with guaranteed authenticated user and permission
 *     return NextResponse.json({ data: [] });
 *   }
 * );
 * ```
 */
export function withPermission(
  permission: Permission,
  handler: RouteHandler
) {
  return withAuth(async (req, user) => {
    try {
      requirePermission(user, permission);
      return await handler(req, user);
    } catch (error: any) {
      if (error.status === 403) {
        return NextResponse.json(
          { error: "Permission denied" },
          { status: 403 }
        );
      }
      throw error;
    }
  });
}
