import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { payPlans, commissionRules, personPayPlans } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

const updatePayPlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
    try {
      const [payPlan] = await db
        .select()
        .from(payPlans)
        .where(eq(payPlans.id, id))
        .limit(1);

      if (!payPlan) {
        return NextResponse.json(
          { error: "Pay plan not found" },
          { status: 404 }
        );
      }

      // Fetch associated commission rules
      const rules = await db
        .select()
        .from(commissionRules)
        .where(eq(commissionRules.payPlanId, id))
        .orderBy(commissionRules.sortOrder, commissionRules.createdAt);

      return NextResponse.json({
        ...payPlan,
        rules,
      });
    } catch (error: any) {
      console.error("Error fetching pay plan:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
    try {
      const body = await req.json();
      const validated = updatePayPlanSchema.parse(body);

      // Check if pay plan exists
      const [existing] = await db
        .select()
        .from(payPlans)
        .where(eq(payPlans.id, id))
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { error: "Pay plan not found" },
          { status: 404 }
        );
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (validated.name !== undefined) {
        updateData.name = validated.name;
      }
      if (validated.description !== undefined) {
        updateData.description = validated.description || null;
      }
      if (validated.isActive !== undefined) {
        updateData.isActive = validated.isActive;
      }

      const [updated] = await db
        .update(payPlans)
        .set(updateData)
        .where(eq(payPlans.id, id))
        .returning();

      return NextResponse.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating pay plan:", error);
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
  return withPermission(Permission.MANAGE_SETTINGS, async (req, user) => {
    try {
      // Check if pay plan exists
      const [existing] = await db
        .select()
        .from(payPlans)
        .where(eq(payPlans.id, id))
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { error: "Pay plan not found" },
          { status: 404 }
        );
      }

      // Check if pay plan is currently assigned to any person
      const activeAssignments = await db
        .select()
        .from(personPayPlans)
        .where(
          and(
            eq(personPayPlans.payPlanId, id),
            isNull(personPayPlans.endDate)
          )
        )
        .limit(1);

      if (activeAssignments.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot delete pay plan that is currently assigned to people. Deactivate it instead.",
          },
          { status: 400 }
        );
      }

      // Soft delete by setting isActive to false
      const [deleted] = await db
        .update(payPlans)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(payPlans.id, id))
        .returning();

      return NextResponse.json({ success: true, payPlan: deleted });
    } catch (error: any) {
      console.error("Error deleting pay plan:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
