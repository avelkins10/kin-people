import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canManageRepcardAccounts } from "@/lib/permissions/repcard";
import {
  createRepcardAccount,
  getAllRepcardAccounts,
  getOfficeMappingByOfficeId,
  getRoleMappingByRoleId,
} from "@/lib/db/helpers/repcard-helpers";
import { getPersonWithDetails } from "@/lib/db/helpers/person-helpers";
import { updateRepcardUser } from "@/lib/integrations/repcard";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";

const createSchema = z.object({
  personId: z.string().uuid(),
  username: z.string().min(1),
  jobTitle: z.string().optional(),
});

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const canCreate = await canManageRepcardAccounts(user.id, "create");
    if (!canCreate) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await req.json();
    const validated = createSchema.parse(body);

    const personData = await getPersonWithDetails(validated.personId);
    if (!personData) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const { person } = personData;

    // Look up mappings
    const officeMapping = person.officeId
      ? await getOfficeMappingByOfficeId(person.officeId)
      : null;
    const roleMapping = person.roleId
      ? await getRoleMappingByRoleId(person.roleId)
      : null;

    const repcardData = {
      firstName: person.firstName,
      lastName: person.lastName,
      userEmail: person.email,
      phoneNumber: person.phone ?? undefined,
      jobTitle: validated.jobTitle,
      username: validated.username,
      roleName: roleMapping?.repcardRole ?? "Sales Rep",
      officeName: officeMapping?.repcardOffice ?? "Default",
      teamName: officeMapping?.repcardTeam ?? undefined,
      externalId: person.id,
    };

    // Create user in RepCard (uses PUT)
    const repcardUser = await updateRepcardUser(validated.username, repcardData);

    // Create local record
    const account = await createRepcardAccount({
      personId: validated.personId,
      repcardUserId: String(repcardUser.id ?? validated.username),
      repcardUsername: validated.username,
      jobTitle: validated.jobTitle ?? null,
      repcardRole: roleMapping?.repcardRole ?? null,
      repcardOffice: officeMapping?.repcardOffice ?? null,
      repcardTeam: officeMapping?.repcardTeam ?? null,
      status: "active",
      lastSyncedAt: new Date(),
      createdBy: user.id,
    });

    try {
      await logActivity({
        entityType: "repcard_account",
        entityId: account.id,
        action: "created",
        details: { personId: validated.personId, repcardUserId: account.repcardUserId },
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
    console.error("Error creating RepCard account:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const accounts = await getAllRepcardAccounts(status);
    return NextResponse.json(accounts);
  } catch (error: unknown) {
    console.error("Error fetching RepCard accounts:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
