import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, roles, offices } from "@/lib/db/schema";
import { eq, and, or, sql, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import type { PersonData, RelationshipType } from "@/types/org-chart";

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const view = (searchParams.get("view") || "reports_to") as RelationshipType;
    const officeFilter = searchParams.get("office");
    const searchQuery = searchParams.get("search");

    // Check permissions
    const canViewAll = hasPermission(user, Permission.VIEW_ALL_PEOPLE);
    const canViewOffice = hasPermission(
      user,
      Permission.VIEW_OWN_OFFICE_PEOPLE
    );

    if (!canViewAll && !canViewOffice) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Build where conditions
    const conditions = [];

    // Office visibility filter based on permissions
    if (!canViewAll && canViewOffice && user.officeId) {
      conditions.push(eq(people.officeId, user.officeId));
    }

    // Apply office filter if provided
    if (officeFilter) {
      conditions.push(eq(people.officeId, officeFilter));
    }

    // Apply search filter if provided
    if (searchQuery) {
      const pattern = `%${searchQuery.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${people.firstName} || ' ' || ${people.lastName}) LIKE ${pattern}`,
          sql`LOWER(${people.email}) LIKE ${pattern}`
        )!
      );
    }

    // Fetch people with related data
    const peopleList = await db
      .select({
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
        roleName: roles.name,
        officeId: people.officeId,
        officeName: offices.name,
        reportsToId: people.reportsToId,
        recruitedById: people.recruitedById,
        status: people.status,
        profileImageUrl: people.profileImageUrl,
      })
      .from(people)
      .leftJoin(roles, eq(people.roleId, roles.id))
      .leftJoin(offices, eq(people.officeId, offices.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(people.lastName, people.firstName);

    // If search query provided, include full upward chain to root
    if (searchQuery) {
      const matchingPeople = peopleList.map((p) => p.id);
      const allPeopleIds = new Set<string>(matchingPeople);

      // Find all ancestors for matching people
      const findAncestors = (personId: string, visited: Set<string>) => {
        if (visited.has(personId)) return;
        visited.add(personId);

        const person = peopleList.find((p) => p.id === personId);
        if (!person) return;

        const relationshipId =
          view === "reports_to" ? person.reportsToId : person.recruitedById;

        if (relationshipId && !allPeopleIds.has(relationshipId)) {
          allPeopleIds.add(relationshipId);
          findAncestors(relationshipId, visited);
        }
      };

      matchingPeople.forEach((id) => findAncestors(id, new Set()));

      // Fetch all ancestors
      if (allPeopleIds.size > peopleList.length) {
        const ancestorIds = Array.from(allPeopleIds).filter(
          (id) => !matchingPeople.includes(id)
        );

        const ancestors = await db
          .select({
            id: people.id,
            firstName: people.firstName,
            lastName: people.lastName,
            email: people.email,
            roleName: roles.name,
            officeId: people.officeId,
            officeName: offices.name,
            reportsToId: people.reportsToId,
            recruitedById: people.recruitedById,
            status: people.status,
            profileImageUrl: people.profileImageUrl,
          })
          .from(people)
          .leftJoin(roles, eq(people.roleId, roles.id))
          .leftJoin(offices, eq(people.officeId, offices.id))
          .where(
            and(
              inArray(people.id, ancestorIds),
              conditions.length > 0 ? and(...conditions) : undefined
            )
          );

        // Combine and deduplicate
        const combined = [...peopleList, ...ancestors];
        const uniqueMap = new Map<string, PersonData>();
        combined.forEach((p) => {
          if (!uniqueMap.has(p.id)) {
            uniqueMap.set(p.id, p);
          }
        });

        return NextResponse.json(Array.from(uniqueMap.values()));
      }
    }

    return NextResponse.json(peopleList);
  } catch (error: any) {
    console.error("Error fetching org chart data:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});
