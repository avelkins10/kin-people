import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { commissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { canViewCommission } from "@/lib/auth/visibility-rules";

const updateStatusSchema = z.object({
  status: z.enum(["pending", "approved", "paid", "held", "void"]),
  statusReason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.APPROVE_COMMISSIONS, async (req: NextRequest, user) => {
    try {
      const commissionId = id;
      const body = await req.json();
      const validated = updateStatusSchema.parse(body);

      // Fetch commission to check visibility
      const [commissionData] = await db
        .select()
        .from(commissions)
        .where(eq(commissions.id, commissionId))
        .limit(1);

      if (!commissionData) {
        return NextResponse.json(
          { error: "Commission not found" },
          { status: 404 }
        );
      }

      // Check visibility
      const canView = await canViewCommission(user, {
        personId: commissionData.personId,
        reportsToId: null,
      });

      if (!canView) {
        return NextResponse.json(
          { error: "Permission denied" },
          { status: 403 }
        );
      }

      // Prepare update data
      const updateData: any = {
        status: validated.status,
        updatedAt: new Date(),
      };

      // Set status reason if provided
      if (validated.statusReason) {
        updateData.statusReason = validated.statusReason;
      }

      // Set paidAt timestamp if status is "paid"
      if (validated.status === "paid") {
        updateData.paidAt = new Date();
      }

      // Update commission
      const [updatedCommission] = await db
        .update(commissions)
        .set(updateData)
        .where(eq(commissions.id, commissionId))
        .returning();

      return NextResponse.json(updatedCommission);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating commission status:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
