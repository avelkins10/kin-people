import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import { getTemplates } from "@/lib/integrations/signnow";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const templates = await getTemplates();
    return NextResponse.json(templates);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string"
            ? (error as { message: string }).message
            : "Failed to fetch templates";
    console.error("[api/signnow/templates] error:", message, "raw:", String(error));
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
});
