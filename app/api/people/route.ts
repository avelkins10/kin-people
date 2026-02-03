import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { people, roles, offices } from "@/lib/db/schema";
import { eq, gte, sql, and } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

const createPersonSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  roleId: z.string().uuid(),
  officeId: z.string().uuid().optional(),
  reportsToId: z.string().uuid().optional(),
  status: z.enum(["onboarding", "active", "inactive"]).optional().default("active"),
  hireDate: z.string().optional(),
});

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

export const POST = withPermission(Permission.VIEW_ALL_PEOPLE, async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validated = createPersonSchema.parse(body);

    const [newPerson] = await db
      .insert(people)
      .values({
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        phone: validated.phone || null,
        roleId: validated.roleId,
        officeId: validated.officeId || null,
        reportsToId: validated.reportsToId || null,
        status: validated.status,
        hireDate: validated.hireDate || null,
      })
      .returning({ id: people.id });

    return NextResponse.json(
      { id: newPerson?.id, message: "Person created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "A person with this email already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating person:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});
