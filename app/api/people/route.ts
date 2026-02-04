import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { people, roles, offices } from "@/lib/db/schema";
import { eq, gte, sql, and } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { generateKinId } from "@/lib/db/helpers/kin-id-helpers";
import {
  normalizePhone,
  checkForDuplicatePerson,
  formatDuplicateError,
} from "@/lib/db/helpers/duplicate-helpers";

const managerAlias = alias(people, "manager");

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
    const roleId = searchParams.get("roleId");
    const status = searchParams.get("status");
    const officeId = searchParams.get("officeId");

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
        roleName: roles.name,
        setterTier: people.setterTier,
        name: sql<string>`CONCAT(${people.firstName}, ' ', ${people.lastName})`,
        managerName: sql<string | null>`CONCAT(${managerAlias.firstName}, ' ', ${managerAlias.lastName})`,
      })
      .from(people)
      .innerJoin(roles, eq(people.roleId, roles.id))
      .leftJoin(offices, eq(people.officeId, offices.id))
      .leftJoin(managerAlias, eq(people.reportsToId, managerAlias.id));

    const conditions: ReturnType<typeof eq>[] = [];
    if (roleLevel === "manager") {
      conditions.push(gte(roles.level, 3) as any);
    }
    if (status) {
      conditions.push(eq(people.status, status));
    }
    if (officeId) {
      conditions.push(eq(people.officeId, officeId));
    }
    if (roleId) {
      conditions.push(eq(people.roleId, roleId));
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

    // Check for duplicate person
    const duplicatePerson = await checkForDuplicatePerson(
      validated.email,
      validated.phone
    );
    if (duplicatePerson.isDuplicate) {
      return NextResponse.json(
        { error: formatDuplicateError(duplicatePerson, "person") },
        { status: 409 }
      );
    }

    // Generate KIN ID for new person
    const kinId = await generateKinId();

    // Normalize phone for storage
    const normalizedPhone = normalizePhone(validated.phone);

    const [newPerson] = await db
      .insert(people)
      .values({
        kinId,
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        phone: validated.phone || null,
        normalizedPhone,
        roleId: validated.roleId,
        officeId: validated.officeId || null,
        reportsToId: validated.reportsToId || null,
        status: validated.status,
        hireDate: validated.hireDate || null,
      })
      .returning({ id: people.id, kinId: people.kinId });

    return NextResponse.json(
      { id: newPerson?.id, kinId: newPerson?.kinId, message: "Person created successfully" },
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
