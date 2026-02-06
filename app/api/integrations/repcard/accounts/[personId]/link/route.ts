import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canManageRepcardAccounts } from "@/lib/permissions/repcard";
import {
  createRepcardAccount,
  getRepcardAccountByPersonId,
} from "@/lib/db/helpers/repcard-helpers";
import { getRepcardUser } from "@/lib/integrations/repcard";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

const linkSchema = z.object({
  repcardUserId: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  const { personId } = await params;
  return withAuth(async (req, user) => {
    try {
      const canLink = await canManageRepcardAccounts(user.id, "link");
      if (!canLink) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      const body = await req.json();
      const validated = linkSchema.parse(body);

      // Check if person already has a RepCard account
      const existing = await getRepcardAccountByPersonId(personId);
      if (existing) {
        return NextResponse.json(
          { error: "Person already has a RepCard account linked" },
          { status: 409 }
        );
      }

      // Fetch RepCard user details
      const repcardUser = await getRepcardUser(validated.repcardUserId);

      // Create local record
      const account = await createRepcardAccount({
        personId,
        repcardUserId: String(repcardUser.id),
        repcardUsername: repcardUser.username,
        jobTitle: repcardUser.jobTitle ?? null,
        repcardRole: repcardUser.roleName ?? null,
        repcardOffice: repcardUser.office ?? null,
        repcardTeam: repcardUser.team ?? null,
        status: repcardUser.status === 0 ? "deactivated" : "active",
        lastSyncedAt: new Date(),
        createdBy: user.id,
      });

      try {
        await logActivity({
          entityType: "repcard_account",
          entityId: account.id,
          action: "linked",
          details: { personId, repcardUserId: validated.repcardUserId },
          actorId: user.id,
        });
      } catch (logError) {
        console.error("Failed to log activity:", logError);
      }

      return NextResponse.json(account, { status: 201 });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error linking RepCard account:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
