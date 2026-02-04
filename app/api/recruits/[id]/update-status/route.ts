import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canManageRecruit } from "@/lib/auth/visibility-rules";
import { updateRecruitStatus, getRecruitWithDetails } from "@/lib/db/helpers/recruit-helpers";

const updateStatusSchema = z.object({
  newStatus: z.enum([
    "lead",
    "contacted",
    "interviewing",
    "offer_sent",
    "agreement_sent",
    "agreement_signed",
    "onboarding",
    "converted",
    "rejected",
    "dropped",
  ]),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (req, user) => {
    try {
      const body = await req.json();
      const validated = updateStatusSchema.parse(body);

      // Agreement Sent and Agreement Signed are set by automation (send-document flow and webhook). Use agreement-override for admin override.
      if (validated.newStatus === "agreement_sent") {
        return NextResponse.json(
          {
            error:
              "Agreement Sent is set automatically when you send the rep agreement. Use the Send Rep Agreement flow, or use Admin Override if you have permission.",
          },
          { status: 400 }
        );
      }
      if (validated.newStatus === "agreement_signed") {
        return NextResponse.json(
          {
            error:
              "Agreement Signed is set automatically when the rep agreement is fully signed. Use Admin Override if you need to set this manually.",
          },
          { status: 400 }
        );
      }

      // Check management permission
      const canManage = await canManageRecruit(user, id);
      if (!canManage) {
        return NextResponse.json(
          { error: "You do not have permission to manage this recruit" },
          { status: 403 }
        );
      }

      // Update status
      await updateRecruitStatus(id, validated.newStatus, user.id, validated.notes);

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
      console.error("Error updating recruit status:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
