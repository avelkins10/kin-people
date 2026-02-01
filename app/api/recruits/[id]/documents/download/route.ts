import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import { getSignedUrl } from "@/lib/supabase/storage";
import { getRecruitWithDetails } from "@/lib/db/helpers/recruit-helpers";
import { canViewRecruit } from "@/lib/auth/visibility-rules";

const BUCKET_NAME = "agreements";
const EXPIRES_IN = 300; // 5 minutes

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recruitId } = await params;
  return withAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const documentPath = searchParams.get("documentPath");

      if (!documentPath) {
        return NextResponse.json(
          { error: "documentPath is required" },
          { status: 400 }
        );
      }

      const recruitData = await getRecruitWithDetails(recruitId);

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
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (recruitData.recruit.agreementDocumentPath !== documentPath) {
        return NextResponse.json(
          { error: "Document not found or access denied" },
          { status: 404 }
        );
      }

      const signedUrl = await getSignedUrl(
        BUCKET_NAME,
        documentPath,
        EXPIRES_IN
      );

      return NextResponse.json({ signedUrl });
    } catch (error) {
      console.error("Error generating recruit document download URL:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Internal server error",
        },
        { status: 500 }
      );
    }
  })(req);
}
