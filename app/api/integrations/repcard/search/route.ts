import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import { searchRepcardUsers } from "@/lib/integrations/repcard";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "";

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const users = await searchRepcardUsers(query);
    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error("Error searching RepCard users:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
