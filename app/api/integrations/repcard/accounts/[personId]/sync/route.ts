import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import { canManageRepcardAccounts } from "@/lib/permissions/repcard";
import {
  getRepcardAccountByPersonId,
  setRepcardAccountStatus,
  getOfficeMappingByOfficeId,
  getRoleMappingByRoleId,
} from "@/lib/db/helpers/repcard-helpers";
import { getPersonWithDetails } from "@/lib/db/helpers/person-helpers";
import { updateRepcardUser } from "@/lib/integrations/repcard";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  const { personId } = await params;
  return withAuth(async (req, user) => {
    try {
      const canSync = await canManageRepcardAccounts(user.id, "sync");
      if (!canSync) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      const existing = await getRepcardAccountByPersonId(personId);
      if (!existing) {
        return NextResponse.json({ error: "RepCard account not found" }, { status: 404 });
      }

      const personData = await getPersonWithDetails(personId);
      if (!personData) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }

      const { person } = personData;

      // Get mappings
      const officeMapping = person.officeId
        ? await getOfficeMappingByOfficeId(person.officeId)
        : null;
      const roleMapping = person.roleId
        ? await getRoleMappingByRoleId(person.roleId)
        : null;

      // Sync to RepCard API (skip if userId is missing or invalid)
      if (existing.account.repcardUserId && existing.account.repcardUserId !== "undefined") {
        try {
          await updateRepcardUser(existing.account.repcardUserId, {
            firstName: person.firstName,
            lastName: person.lastName,
            userEmail: person.email,
            phoneNumber: person.phone ?? undefined,
            jobTitle: existing.account.jobTitle ?? undefined,
            roleName: roleMapping?.repcardRole ?? undefined,
            officeName: officeMapping?.repcardOffice ?? undefined,
            teamName: officeMapping?.repcardTeam ?? undefined,
            externalId: person.id,
          });

          await setRepcardAccountStatus(existing.account.id, "active");
        } catch (syncError) {
          await setRepcardAccountStatus(
            existing.account.id,
            "error",
            (syncError as Error).message
          );

          try {
            await logActivity({
              entityType: "repcard_account",
              entityId: existing.account.id,
              action: "sync_failed",
              details: { personId, error: (syncError as Error).message },
              actorId: user.id,
            });
          } catch (logError) {
            console.error("Failed to log activity:", logError);
          }

          return NextResponse.json(
            { error: "Sync failed: " + (syncError as Error).message },
            { status: 502 }
          );
        }
      }

      try {
        await logActivity({
          entityType: "repcard_account",
          entityId: existing.account.id,
          action: "synced",
          details: { personId },
          actorId: user.id,
        });
      } catch (logError) {
        console.error("Failed to log activity:", logError);
      }

      const updated = await getRepcardAccountByPersonId(personId);
      return NextResponse.json(updated);
    } catch (error: unknown) {
      console.error("Error syncing RepCard account:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
