import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import { getRecruitHistory } from "@/lib/db/helpers/recruit-helpers";
import { canViewRecruit } from "@/lib/auth/visibility-rules";
import { getRecruitWithDetails } from "@/lib/db/helpers/recruit-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (req, user) => {
    try {
      // Check visibility
      const recruitData = await getRecruitWithDetails(id);
      if (!recruitData) {
        return NextResponse.json(
          { error: "Recruit not found" },
          { status: 404 }
        );
      }

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

      // Fetch history
      const history = await getRecruitHistory(id);

      return NextResponse.json(history);
    } catch (error: any) {
      console.error("Error fetching recruit history:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
