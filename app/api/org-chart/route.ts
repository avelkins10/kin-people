import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, roles, offices } from "@/lib/db/schema";
import { eq, and, or, sql, inArray, gte } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import type { PersonData, RelationshipType, PersonStatus, RoleLevelFilter } from "@/types/org-chart";

// Default statuses to show when no filter specified
const DEFAULT_STATUSES: PersonStatus[] = ['active', 'onboarding'];

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const view = (searchParams.get("view") || "reports_to") as RelationshipType;
    const officeFilter = searchParams.get("office");
    const searchQuery = searchParams.get("search");
    const focusPersonId = searchParams.get("focus");

    // Parse status filter - comma-separated list or default
    const statusParam = searchParams.get("status");
    const statusFilter: PersonStatus[] = statusParam
      ? statusParam.split(",").filter(s => ['active', 'onboarding', 'inactive', 'terminated'].includes(s)) as PersonStatus[]
      : DEFAULT_STATUSES;

    // Parse role level filter
    const roleLevelFilter = (searchParams.get("roleLevel") || "all") as RoleLevelFilter;

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

    // Apply status filter
    if (statusFilter.length > 0) {
      conditions.push(inArray(people.status, statusFilter));
    }

    // Apply role level filter
    if (roleLevelFilter !== 'all') {
      if (roleLevelFilter === '1') {
        conditions.push(eq(roles.level, 1));
      } else if (roleLevelFilter === '2') {
        conditions.push(eq(roles.level, 2));
      } else if (roleLevelFilter === '3+') {
        conditions.push(gte(roles.level, 3));
      }
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

    // Fetch people with related data including role level
    const peopleList = await db
      .select({
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
        roleName: roles.name,
        roleLevel: roles.level,
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

    // Compute direct report counts
    const reportCounts = new Map<string, number>();
    peopleList.forEach((person) => {
      const parentId = view === "reports_to" ? person.reportsToId : person.recruitedById;
      if (parentId) {
        reportCounts.set(parentId, (reportCounts.get(parentId) || 0) + 1);
      }
    });

    // Add directReportCount to each person
    const peopleWithCounts: PersonData[] = peopleList.map((person) => ({
      ...person,
      status: person.status as PersonStatus | null,
      directReportCount: reportCounts.get(person.id) || 0,
    }));

    // Handle focus mode - get full upline and downline for a person
    if (focusPersonId) {
      const focusPerson = peopleWithCounts.find((p) => p.id === focusPersonId);
      if (focusPerson) {
        const focusedIds = new Set<string>([focusPersonId]);

        // Get upline (managers chain to root)
        let currentId: string | null = view === "reports_to"
          ? focusPerson.reportsToId
          : focusPerson.recruitedById;

        while (currentId) {
          focusedIds.add(currentId);
          const parent = peopleWithCounts.find((p) => p.id === currentId);
          if (!parent) break;
          currentId = view === "reports_to" ? parent.reportsToId : parent.recruitedById;
        }

        // Get downline (all reports recursively)
        const getDownline = (parentId: string) => {
          peopleWithCounts.forEach((p) => {
            const pParentId = view === "reports_to" ? p.reportsToId : p.recruitedById;
            if (pParentId === parentId && !focusedIds.has(p.id)) {
              focusedIds.add(p.id);
              getDownline(p.id);
            }
          });
        };
        getDownline(focusPersonId);

        const focusedPeople = peopleWithCounts.filter((p) => focusedIds.has(p.id));
        return NextResponse.json(focusedPeople);
      }
    }

    // If search query provided, include full upward chain to root
    if (searchQuery) {
      const matchingPeople = peopleWithCounts.map((p) => p.id);
      const allPeopleIds = new Set<string>(matchingPeople);

      // Find all ancestors for matching people
      const findAncestors = (personId: string, visited: Set<string>) => {
        if (visited.has(personId)) return;
        visited.add(personId);

        const person = peopleWithCounts.find((p) => p.id === personId);
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
      if (allPeopleIds.size > peopleWithCounts.length) {
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
            roleLevel: roles.level,
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

        // Add directReportCount to ancestors
        const ancestorsWithCounts: PersonData[] = ancestors.map((person) => ({
          ...person,
          status: person.status as PersonStatus | null,
          directReportCount: reportCounts.get(person.id) || 0,
        }));

        // Combine and deduplicate
        const combined = [...peopleWithCounts, ...ancestorsWithCounts];
        const uniqueMap = new Map<string, PersonData>();
        combined.forEach((p) => {
          if (!uniqueMap.has(p.id)) {
            uniqueMap.set(p.id, p);
          }
        });

        return NextResponse.json(Array.from(uniqueMap.values()));
      }
    }

    return NextResponse.json(peopleWithCounts);
  } catch (error: any) {
    console.error("Error fetching org chart data:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});
