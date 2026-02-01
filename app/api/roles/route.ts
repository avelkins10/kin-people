import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = db.select().from(roles);

    if (activeOnly) {
      query = query.where(eq(roles.isActive, true)) as any;
    }

    const rolesList = await query;

    return NextResponse.json(rolesList);
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});
