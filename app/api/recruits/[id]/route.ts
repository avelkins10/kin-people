import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recruits, recruitHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { getRecruitWithDetails } from "@/lib/db/helpers/recruit-helpers";
import { canViewRecruit, canManageRecruit } from "@/lib/auth/visibility-rules";

const updateRecruitSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  targetOfficeId: z.string().uuid().optional(),
  targetTeamId: z.string().uuid().optional(),
  targetReportsToId: z.string().uuid().optional(),
  targetRoleId: z.string().uuid().optional(),
  targetPayPlanId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (req, user) => {
    try {
      const recruitData = await getRecruitWithDetails(id);

      if (!recruitData) {
        return NextResponse.json(
          { error: "Recruit not found" },
          { status: 404 }
        );
      }

      // Check visibility
      const canView = await canViewRecruit(user, {
        recruiterId: recruitData.recruit.recruiterId,
        targetOfficeId: recruitData.recruit.targetOfficeId,
      });

      if (!canView) {
        return NextResponse.json(
          { error: "You do not have permission to view this recruit" },
          { status: 403 }
        );
      }

      return NextResponse.json(recruitData);
    } catch (error: any) {
      console.error("Error fetching recruit:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
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
  return withAuth(async (req, user) => {
    try {
      const body = await req.json();
      const validated = updateRecruitSchema.parse(body);

      // Check management permission
      const canManage = await canManageRecruit(user, id);
      if (!canManage) {
        return NextResponse.json(
          { error: "You do not have permission to manage this recruit" },
          { status: 403 }
        );
      }

      // Build update object
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (validated.firstName !== undefined) updateData.firstName = validated.firstName;
      if (validated.lastName !== undefined) updateData.lastName = validated.lastName;
      if (validated.email !== undefined) updateData.email = validated.email;
      if (validated.phone !== undefined) updateData.phone = validated.phone;
      if (validated.source !== undefined) updateData.source = validated.source;
      if (validated.targetOfficeId !== undefined) updateData.targetOfficeId = validated.targetOfficeId;
      if (validated.targetTeamId !== undefined) updateData.targetTeamId = validated.targetTeamId;
      if (validated.targetReportsToId !== undefined) updateData.targetReportsToId = validated.targetReportsToId;
      if (validated.targetRoleId !== undefined) updateData.targetRoleId = validated.targetRoleId;
      if (validated.targetPayPlanId !== undefined) updateData.targetPayPlanId = validated.targetPayPlanId;
      if (validated.notes !== undefined) updateData.notes = validated.notes;

      // Update recruit
      const [updated] = await db
        .update(recruits)
        .set(updateData)
        .where(eq(recruits.id, id))
        .returning();

      // Fetch updated recruit with details
      const recruitData = await getRecruitWithDetails(id);

      return NextResponse.json(recruitData);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating recruit:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_OWN_OFFICE, async (req, user) => {
    try {
      // Check management permission
      const canManage = await canManageRecruit(user, id);
      if (!canManage) {
        return NextResponse.json(
          { error: "You do not have permission to manage this recruit" },
          { status: 403 }
        );
      }

      // Fetch current recruit to capture previous status before update
      const [currentRecruit] = await db
        .select()
        .from(recruits)
        .where(eq(recruits.id, id))
        .limit(1);

      if (!currentRecruit) {
        return NextResponse.json(
          { error: "Recruit not found" },
          { status: 404 }
        );
      }

      const previousStatus = currentRecruit.status;

      // Soft delete by setting status to "dropped"
      await db
        .update(recruits)
        .set({
          status: "dropped",
          updatedAt: new Date(),
        })
        .where(eq(recruits.id, id));

      // Create history record with the previous status captured before update
      await db.insert(recruitHistory).values({
        recruitId: id,
        previousStatus: previousStatus,
        newStatus: "dropped",
        notes: "Recruit deleted",
        changedById: user.id,
      });

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting recruit:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
