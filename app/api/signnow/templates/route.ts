import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import { getTemplates } from "@/lib/integrations/signnow";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const templates = await getTemplates();
    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("Error fetching SignNow templates:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch templates" },
      { status: 500 }
    );
  }
});
