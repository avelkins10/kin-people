import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, roles } from "@/lib/db/schema";
import { eq, gte, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const roleLevel = searchParams.get("roleLevel");

    let query = db
      .select({
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        name: sql<string>`CONCAT(${people.firstName}, ' ', ${people.lastName})`,
      })
      .from(people)
      .innerJoin(roles, eq(people.roleId, roles.id));

    if (roleLevel === "manager") {
      // Managers typically have role level >= 3 (Office Manager and above)
      query = query.where(gte(roles.level, 3)) as any;
    }

    const peopleList = await query;

    return NextResponse.json(peopleList);
  } catch (error: any) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});
