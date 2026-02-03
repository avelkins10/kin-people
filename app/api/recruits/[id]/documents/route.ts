import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canViewRecruit } from "@/lib/auth/visibility-rules";
import { getRecruitWithDetails } from "@/lib/db/helpers/recruit-helpers";
import { getDocumentsByRecruit } from "@/lib/db/helpers/document-helpers";

const idSchema = z.object({ id: z.string().uuid() });

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid recruit ID; must be a valid UUID" },
      { status: 400 }
    );
  }
  const recruitId = parsed.data.id;

  return withAuth(async (_req, user) => {
    try {
      const recruitData = await getRecruitWithDetails(recruitId);
      if (!recruitData) {
        return NextResponse.json(
          { error: "Recruit not found" },
          { status: 404 }
        );
      }

      const canView = await canViewRecruit(user, {
        recruiterId: recruitData.recruit.recruiterId ?? "",
        targetOfficeId: recruitData.recruit.targetOfficeId,
      });

      if (!canView) {
        return NextResponse.json(
          { error: "You do not have permission to view this recruit's documents" },
          { status: 403 }
        );
      }

      const documents = await getDocumentsByRecruit(recruitId);
      return NextResponse.json(documents);
    } catch (error) {
      console.error("[api/recruits/[id]/documents] GET failed", {
        recruitId,
        error,
      });
      return NextResponse.json(
        { error: "Failed to load documents" },
        { status: 500 }
      );
    }
  })(req);
}
