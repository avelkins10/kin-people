import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = db.select().from(offices);

    if (activeOnly) {
      query = query.where(eq(offices.isActive, true)) as any;
    }

    const officesList = await query;

    return NextResponse.json(officesList);
  } catch (error: any) {
    console.error("Error fetching offices:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});
