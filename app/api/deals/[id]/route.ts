import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { deals, people, offices, commissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { canViewPerson } from "@/lib/auth/visibility-rules";

const updateDealSchema = z.object({
  setterId: z.string().uuid().optional(),
  closerId: z.string().uuid().optional(),
  dealType: z.string().optional(),
  systemSizeKw: z.string().optional(),
  ppw: z.string().optional(),
  dealValue: z.string().optional(),
  saleDate: z.string().optional(),
  closeDate: z.string().optional(),
  installDate: z.string().optional(),
  ptoDate: z.string().optional(),
  customerName: z.string().optional(),
  customerAddress: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  officeId: z.string().uuid().optional(),
  status: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req: NextRequest, user) => {
    try {
      const { id } = await params;

      // Fetch deal
      const [dealData] = await db
        .select({
          deal: deals,
        })
        .from(deals)
        .where(eq(deals.id, id))
        .limit(1);

      if (!dealData) {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }

      const deal = dealData.deal;

      // Check visibility - user must be able to view setter or closer
      const canViewSetter = await canViewPerson(user, deal.setterId);
      const canViewCloser = await canViewPerson(user, deal.closerId);

      if (!canViewSetter && !canViewCloser) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      // Fetch related data
      const [setterData] = await db
        .select()
        .from(people)
        .where(eq(people.id, deal.setterId))
        .limit(1);

      const [closerData] = await db
        .select()
        .from(people)
        .where(eq(people.id, deal.closerId))
        .limit(1);

      const [officeData] = deal.officeId
        ? await db
            .select()
            .from(offices)
            .where(eq(offices.id, deal.officeId))
            .limit(1)
        : [null];

      // Fetch commissions for this deal
      const dealCommissions = await db
        .select()
        .from(commissions)
        .where(eq(commissions.dealId, deal.id));

      return NextResponse.json({
        deal,
        setter: setterData
          ? {
              id: setterData.id,
              firstName: setterData.firstName,
              lastName: setterData.lastName,
              email: setterData.email,
            }
          : null,
        closer: closerData
          ? {
              id: closerData.id,
              firstName: closerData.firstName,
              lastName: closerData.lastName,
              email: closerData.email,
            }
          : null,
        office: officeData
          ? {
              id: officeData.id,
              name: officeData.name,
            }
          : null,
        commissions: dealCommissions,
      });
    } catch (error: any) {
      console.error("Error fetching deal:", error);
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
  return withPermission(Permission.EDIT_DEALS, async (req: NextRequest, user) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validated = updateDealSchema.parse(body);

      // Check if deal exists
      const [existingDeal] = await db
        .select()
        .from(deals)
        .where(eq(deals.id, id))
        .limit(1);

      if (!existingDeal) {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }

      // Check visibility
      const canViewSetter = await canViewPerson(user, existingDeal.setterId);
      const canViewCloser = await canViewPerson(user, existingDeal.closerId);

      if (!canViewSetter && !canViewCloser) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      // Update isSelfGen if setter or closer changed
      let isSelfGen = existingDeal.isSelfGen;
      const newSetterId = validated.setterId || existingDeal.setterId;
      const newCloserId = validated.closerId || existingDeal.closerId;
      if (validated.setterId || validated.closerId) {
        isSelfGen = newSetterId === newCloserId;
      }

      // Build update object
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (validated.setterId !== undefined) updateData.setterId = validated.setterId;
      if (validated.closerId !== undefined) updateData.closerId = validated.closerId;
      if (validated.dealType !== undefined) updateData.dealType = validated.dealType;
      if (validated.systemSizeKw !== undefined) updateData.systemSizeKw = validated.systemSizeKw || null;
      if (validated.ppw !== undefined) updateData.ppw = validated.ppw || null;
      if (validated.dealValue !== undefined) updateData.dealValue = validated.dealValue;
      if (validated.saleDate !== undefined) updateData.saleDate = validated.saleDate || null;
      if (validated.closeDate !== undefined) updateData.closeDate = validated.closeDate || null;
      if (validated.installDate !== undefined) updateData.installDate = validated.installDate || null;
      if (validated.ptoDate !== undefined) updateData.ptoDate = validated.ptoDate || null;
      if (validated.customerName !== undefined) updateData.customerName = validated.customerName || null;
      if (validated.customerAddress !== undefined) updateData.customerAddress = validated.customerAddress || null;
      if (validated.customerEmail !== undefined) updateData.customerEmail = validated.customerEmail || null;
      if (validated.customerPhone !== undefined) updateData.customerPhone = validated.customerPhone || null;
      if (validated.officeId !== undefined) updateData.officeId = validated.officeId || null;
      if (validated.status !== undefined) updateData.status = validated.status;
      if (validated.metadata !== undefined) updateData.metadata = validated.metadata;
      updateData.isSelfGen = isSelfGen;

      // Update deal
      const [updatedDeal] = await db
        .update(deals)
        .set(updateData)
        .where(eq(deals.id, id))
        .returning();

      // TODO: If close_date or participants changed, may need to recalculate commissions
      // This is a future enhancement

      return NextResponse.json(updatedDeal);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error updating deal:", error);
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
  return withPermission(Permission.DELETE_DEALS, async (req: NextRequest, user) => {
    try {
      const { id } = await params;

      // Check if deal exists
      const [existingDeal] = await db
        .select()
        .from(deals)
        .where(eq(deals.id, id))
        .limit(1);

      if (!existingDeal) {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }

      // Check visibility
      const canViewSetter = await canViewPerson(user, existingDeal.setterId);
      const canViewCloser = await canViewPerson(user, existingDeal.closerId);

      if (!canViewSetter && !canViewCloser) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      // Update deal status to cancelled (soft delete)
      await db
        .update(deals)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(deals.id, id));

      // Update related commissions to void
      await db
        .update(commissions)
        .set({
          status: "void",
          statusReason: "Deal cancelled",
          updatedAt: new Date(),
        })
        .where(eq(commissions.dealId, id));

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting deal:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
