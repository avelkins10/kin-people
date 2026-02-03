import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { commissions } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

const markPaidSchema = z.object({
  commissionIds: z.array(z.string().uuid()).min(1),
});

export const POST = withPermission(Permission.RUN_PAYROLL, async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { commissionIds } = markPaidSchema.parse(body);

    await db
      .update(commissions)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(commissions.id, commissionIds));

    return NextResponse.json({ success: true, count: commissionIds.length });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error marking commissions paid:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
