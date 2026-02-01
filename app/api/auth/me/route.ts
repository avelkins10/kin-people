import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getRolePermissions } from "@/lib/permissions/roles";

/**
 * GET /api/auth/me
 * 
 * Returns the current authenticated user with their role and permissions.
 * Returns 401 if not authenticated.
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const permissions = getRolePermissions(user.roleName);

  return NextResponse.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
      roleLevel: user.roleLevel,
      officeId: user.officeId,
      reportsToId: user.reportsToId,
      recruitedById: user.recruitedById,
      status: user.status,
    },
    permissions,
  });
}
