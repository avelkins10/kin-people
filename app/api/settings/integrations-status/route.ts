import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

/**
 * GET /api/settings/integrations-status
 * Returns whether each integration is configured (no secrets).
 * Admin only (MANAGE_SETTINGS).
 */
export const GET = withPermission(
  Permission.MANAGE_SETTINGS,
  async () => {
    return NextResponse.json({
      signnow: !!(process.env.SIGNNOW_API_KEY && process.env.SIGNNOW_API_SECRET),
      quickbase: !!process.env.QUICKBASE_WEBHOOK_SECRET,
    });
  }
);
