import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = db.select().from(teams);

    if (activeOnly) {
      query = query.where(eq(teams.isActive, true)) as any;
    }

    const teamsList = await query;

    return NextResponse.json(teamsList);
  } catch (error: any) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});
