import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, roles, offices } from "@/lib/db/schema";
import { eq, gte, sql, and } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const roleLevel = searchParams.get("roleLevel");
    const status = searchParams.get("status");

    let query = db
      .select({
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
        status: people.status,
        hireDate: people.hireDate,
        officeId: people.officeId,
        officeName: offices.name,
        name: sql<string>`CONCAT(${people.firstName}, ' ', ${people.lastName})`,
      })
      .from(people)
      .innerJoin(roles, eq(people.roleId, roles.id))
      .leftJoin(offices, eq(people.officeId, offices.id));

    const conditions: ReturnType<typeof eq>[] = [];
    if (roleLevel === "manager") {
      conditions.push(gte(roles.level, 3) as any);
    }
    if (status) {
      conditions.push(eq(people.status, status));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
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
