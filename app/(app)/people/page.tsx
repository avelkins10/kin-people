import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  people,
  roles,
  offices,
} from "@/lib/db/schema";
import { eq, and, or, like, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { PeopleFilters } from "@/components/people/people-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { alias } from "drizzle-orm";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has permission to view people
  const canViewAll = hasPermission(user, Permission.VIEW_ALL_PEOPLE);
  const canViewOffice = hasPermission(user, Permission.VIEW_OWN_OFFICE_PEOPLE);

  if (!canViewAll && !canViewOffice) {
    redirect("/dashboard");
  }

  // Build filters from search params
  const officeFilter = searchParams.office as string | undefined;
  const roleFilter = searchParams.role as string | undefined;
  const statusFilter = searchParams.status as string | undefined;
  const searchQuery = searchParams.search as string | undefined;

  // Build where conditions
  const conditions = [];

  // Office visibility filter
  if (!canViewAll && canViewOffice && user.officeId) {
    conditions.push(eq(people.officeId, user.officeId));
  }

  // Apply filters
  if (officeFilter) {
    conditions.push(eq(people.officeId, officeFilter));
  }

  if (roleFilter) {
    conditions.push(eq(people.roleId, roleFilter));
  }

  if (statusFilter) {
    conditions.push(eq(people.status, statusFilter));
  }

  if (searchQuery) {
    conditions.push(
      or(
        like(sql`LOWER(${people.firstName} || ' ' || ${people.lastName})`, `%${searchQuery.toLowerCase()}%`),
        like(sql`LOWER(${people.email})`, `%${searchQuery.toLowerCase()}%`)
      )
    );
  }

  // Create alias for manager
  const manager = alias(people, "manager");

  // Fetch people with related data
  const peopleList = await db
    .select({
      id: people.id,
      firstName: people.firstName,
      lastName: people.lastName,
      email: people.email,
      status: people.status,
      roleName: roles.name,
      officeName: offices.name,
      managerFirstName: manager.firstName,
      managerLastName: manager.lastName,
    })
    .from(people)
    .leftJoin(roles, eq(people.roleId, roles.id))
    .leftJoin(offices, eq(people.officeId, offices.id))
    .leftJoin(manager, eq(people.reportsToId, manager.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(people.lastName, people.firstName);

  // Fetch offices and roles for filters
  const [officesList, rolesList] = await Promise.all([
    db
      .select({
        id: offices.id,
        name: offices.name,
      })
      .from(offices)
      .where(eq(offices.isActive, true))
      .orderBy(offices.name),
    db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(roles)
      .where(eq(roles.isActive, true))
      .orderBy(roles.name),
  ]);

  function getStatusBadgeVariant(status: string | null) {
    switch (status) {
      case "active":
        return "default";
      case "onboarding":
        return "secondary";
      case "inactive":
        return "outline";
      case "terminated":
        return "destructive";
      default:
        return "outline";
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">All People</h2>
        <Button asChild>
          <Link href="/people/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </Link>
        </Button>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <PeopleFilters offices={officesList} roles={rolesList} />
      </div>

      <div className="rounded-lg bg-white shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {peopleList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  No people found
                </TableCell>
              </TableRow>
            ) : (
              peopleList.map((person) => (
                <TableRow
                  key={person.id}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell>
                    <Link
                      href={`/people/${person.id}`}
                      className="font-medium hover:underline"
                    >
                      {person.firstName} {person.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{person.email}</TableCell>
                  <TableCell>{person.roleName || "-"}</TableCell>
                  <TableCell>{person.officeName || "-"}</TableCell>
                  <TableCell>
                    {person.managerFirstName && person.managerLastName
                      ? `${person.managerFirstName} ${person.managerLastName}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(person.status)}>
                      {person.status || "active"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
