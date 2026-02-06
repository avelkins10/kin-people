import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canManageRepcardAccounts } from "@/lib/permissions/repcard";
import {
  getRepcardAccountByPersonId,
  updateRepcardAccountFields,
  setRepcardAccountStatus,
  deleteRepcardAccountByPersonId,
} from "@/lib/db/helpers/repcard-helpers";
import {
  updateRepcardUser,
  deactivateRepcardUser,
} from "@/lib/integrations/repcard";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

const updateSchema = z.object({
  jobTitle: z.string().optional(),
  repcardRole: z.string().optional(),
  repcardOffice: z.string().optional(),
  repcardTeam: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  const { personId } = await params;
  return withAuth(async () => {
    try {
      const result = await getRepcardAccountByPersonId(personId);
      if (!result) {
        return NextResponse.json({ error: "RepCard account not found" }, { status: 404 });
      }
      return NextResponse.json(result);
    } catch (error: unknown) {
      console.error("Error fetching RepCard account:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  const { personId } = await params;
  return withAuth(async (req, user) => {
    try {
      const canEdit = await canManageRepcardAccounts(user.id, "edit");
      if (!canEdit) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      const body = await req.json();
      const validated = updateSchema.parse(body);

      const existing = await getRepcardAccountByPersonId(personId);
      if (!existing) {
        return NextResponse.json({ error: "RepCard account not found" }, { status: 404 });
      }

      // Update in RepCard API (skip if userId is missing or invalid)
      if (existing.account.repcardUserId && existing.account.repcardUserId !== "undefined") {
        const apiData: Record<string, string | undefined> = {};
        if (validated.jobTitle !== undefined) apiData.jobTitle = validated.jobTitle;
        if (validated.repcardRole !== undefined) apiData.roleName = validated.repcardRole;
        if (validated.repcardOffice !== undefined) apiData.officeName = validated.repcardOffice;
        if (validated.repcardTeam !== undefined) apiData.teamName = validated.repcardTeam;
        await updateRepcardUser(existing.account.repcardUserId, apiData);
      }

      // Update local record
      const updated = await updateRepcardAccountFields(existing.account.id, validated);

      try {
        await logActivity({
          entityType: "repcard_account",
          entityId: existing.account.id,
          action: "updated",
          details: { personId, changes: validated },
          actorId: user.id,
        });
      } catch (logError) {
        console.error("Failed to log activity:", logError);
      }

      return NextResponse.json(updated);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating RepCard account:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  const { personId } = await params;
  return withAuth(async (req, user) => {
    try {
      const canDeactivate = await canManageRepcardAccounts(user.id, "deactivate");
      if (!canDeactivate) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      const existing = await getRepcardAccountByPersonId(personId);
      if (!existing) {
        return NextResponse.json({ error: "RepCard account not found" }, { status: 404 });
      }

      const { searchParams } = new URL(req.url);
      const unlink = searchParams.get("unlink") === "true";

      // Deactivate in RepCard API (skip if userId is missing or invalid)
      if (!unlink && existing.account.repcardUserId && existing.account.repcardUserId !== "undefined") {
        await deactivateRepcardUser(existing.account.repcardUserId);
      }

      // Unlink: remove local record entirely; Deactivate: just update status
      if (unlink) {
        await deleteRepcardAccountByPersonId(personId);
      }
      const updated = unlink ? null : await setRepcardAccountStatus(existing.account.id, "deactivated");

      try {
        await logActivity({
          entityType: "repcard_account",
          entityId: existing.account.id,
          action: "deactivated",
          details: { personId },
          actorId: user.id,
        });
      } catch (logError) {
        console.error("Failed to log activity:", logError);
      }

      return NextResponse.json(updated);
    } catch (error: unknown) {
      console.error("Error deactivating RepCard account:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
