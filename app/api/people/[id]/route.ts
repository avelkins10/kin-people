import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { people, officeLeadership, teams } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getPersonWithDetails } from "@/lib/db/helpers/person-helpers";
import { checkForDuplicatePerson, formatDuplicateError } from "@/lib/db/helpers/duplicate-helpers";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { canViewPerson } from "@/lib/auth/visibility-rules";
import { personFormSchema } from "@/lib/validation/person-form";
import { logActivity } from "@/lib/db/helpers/activity-log-helpers";
import { getRepcardAccountByPersonId, setRepcardAccountStatus } from "@/lib/db/helpers/repcard-helpers";
import { updateRepcardUser } from "@/lib/integrations/repcard";

// Update schema that accepts all valid DB statuses including "terminated"
const updatePersonSchema = personFormSchema.partial().extend({
  status: z.enum(["onboarding", "active", "inactive", "terminated"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (req, user) => {
    try {
      // Check visibility before returning person data
      const hasAccess = await canViewPerson(user, id);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "You do not have permission to view this person" },
          { status: 403 }
        );
      }

      const personData = await getPersonWithDetails(id);

      if (!personData) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(personData);
    } catch (error: unknown) {
      console.error("Error fetching person:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
    try {
      const body = await req.json();

      // Use updatePersonSchema for validation - accepts all valid DB statuses including "terminated"
      const validated = updatePersonSchema.parse(body);

      // Map "inactive" to "terminated" for database storage
      let dbStatus = validated.status;
      if (dbStatus === "inactive") {
        dbStatus = "terminated";
      }

      // Build update data object with only provided fields
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (validated.firstName !== undefined) updateData.firstName = validated.firstName;
      if (validated.lastName !== undefined) updateData.lastName = validated.lastName;
      if (validated.email !== undefined) updateData.email = validated.email;
      // Convert empty strings to null for optional fields
      if (validated.phone !== undefined) updateData.phone = validated.phone || null;
      if (validated.roleId !== undefined) updateData.roleId = validated.roleId;
      if (validated.officeId !== undefined) updateData.officeId = validated.officeId || null;
      if (validated.reportsToId !== undefined) updateData.reportsToId = validated.reportsToId || null;
      if (dbStatus !== undefined) updateData.status = dbStatus;
      if (validated.hireDate !== undefined) updateData.hireDate = validated.hireDate || null;

      // If email or phone is being changed, check for duplicate (exclude current person)
      if (validated.email !== undefined || validated.phone !== undefined) {
        const current = await db.select({ email: people.email, phone: people.phone }).from(people).where(eq(people.id, id)).limit(1);
        const emailToCheck = validated.email ?? current[0]?.email ?? "";
        const phoneToCheck = validated.phone ?? current[0]?.phone ?? null;
        const duplicatePerson = await checkForDuplicatePerson(emailToCheck, phoneToCheck, id);
        if (duplicatePerson.isDuplicate) {
          return NextResponse.json(
            { error: formatDuplicateError(duplicatePerson, "person") },
            { status: 409 }
          );
        }
      }

      // Update the person in the database
      const [updated] = await db
        .update(people)
        .set(updateData as typeof people.$inferInsert)
        .where(eq(people.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }

      // If status changed to inactive or terminated, end all active leadership roles
      if (validated.status === "inactive" || validated.status === "terminated") {
        const today = new Date().toISOString().slice(0, 10);
        try {
          // End office_leadership assignments
          await db
            .update(officeLeadership)
            .set({ effectiveTo: today, updatedAt: new Date() })
            .where(
              and(
                eq(officeLeadership.personId, id),
                isNull(officeLeadership.effectiveTo)
              )
            );
          // Clear team lead role
          await db
            .update(teams)
            .set({ teamLeadId: null, updatedAt: new Date() })
            .where(eq(teams.teamLeadId, id));
        } catch (leadershipError) {
          console.error("Failed to end leadership roles:", leadershipError);
        }
      }

      // Log the activity
      try {
        await logActivity({
          entityType: "person" as "office", // Type assertion needed as 'person' is not in the union yet
          entityId: id,
          action: "updated",
          details: validated,
          actorId: user.id,
        });
      } catch (logError) {
        // Log error but don't fail the request
        console.error("Failed to log activity:", logError);
      }

      // Auto-sync RepCard if critical fields changed
      const criticalFields = ["firstName", "lastName", "email", "phone"];
      const hasCriticalChange = criticalFields.some((f) => validated[f as keyof typeof validated] !== undefined);
      if (hasCriticalChange) {
        try {
          const repcardAccount = await getRepcardAccountByPersonId(id);
          if (repcardAccount?.account?.repcardUserId && repcardAccount.account.status === "active") {
            const syncData: Record<string, string | undefined> = {};
            if (validated.firstName !== undefined) syncData.firstName = validated.firstName;
            if (validated.lastName !== undefined) syncData.lastName = validated.lastName;
            if (validated.email !== undefined) syncData.userEmail = validated.email;
            if (validated.phone !== undefined) syncData.phoneNumber = validated.phone || undefined;
            await updateRepcardUser(repcardAccount.account.repcardUserId, syncData);
            await setRepcardAccountStatus(repcardAccount.account.id, "active");
          }
        } catch (syncError) {
          // Non-blocking: log but don't fail the person update
          console.error("Failed to auto-sync RepCard account:", syncError);
          try {
            const repcardAccount = await getRepcardAccountByPersonId(id);
            if (repcardAccount?.account) {
              await setRepcardAccountStatus(
                repcardAccount.account.id,
                "error",
                (syncError as Error).message
              );
            }
          } catch (statusError) {
            console.error("Failed to update RepCard sync error status:", statusError);
          }
        }
      }

      return NextResponse.json(updated);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      const err = error as { code?: string; message?: string };
      if (err.code === "23505" && err.message?.includes("people_email_key")) {
        return NextResponse.json(
          { error: "Another person already has this email. Use a different email or update the existing person." },
          { status: 409 }
        );
      }
      console.error("Error updating person:", error);
      return NextResponse.json(
        { error: err.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
