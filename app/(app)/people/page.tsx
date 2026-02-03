import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { people, roles, offices } from "@/lib/db/schema";
import { eq, and, or, sql, type SQL, count } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Plus,
  Download,
  Users,
  GraduationCap,
  UserX,
  MapPin,
  MoreHorizontal,
  Filter,
  X,
} from "lucide-react";
import { aliasedTable } from "drizzle-orm";
import { MetricCard } from "@/components/shared/metric-card";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canViewAll = hasPermission(user, Permission.VIEW_ALL_PEOPLE);
  const canViewOffice = hasPermission(user, Permission.VIEW_OWN_OFFICE_PEOPLE);

  if (!canViewAll && !canViewOffice) {
    redirect("/dashboard");
  }

  const officeFilter = searchParams.office as string | undefined;
  const roleFilter = searchParams.role as string | undefined;
  const statusFilter = searchParams.status as string | undefined;
  const searchQuery = searchParams.search as string | undefined;

  const conditions: SQL[] = [];

  if (!canViewAll && canViewOffice && user.officeId) {
    conditions.push(eq(people.officeId, user.officeId));
  }

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
    const pattern = `%${searchQuery.toLowerCase()}%`;
    const searchCond = or(
      sql`LOWER(${people.firstName} || ' ' || ${people.lastName}) LIKE ${pattern}`,
      sql`LOWER(${people.email}) LIKE ${pattern}`
    );
    if (searchCond) conditions.push(searchCond);
  }

  const manager = aliasedTable(people, "manager");

  type PeopleRow = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string | null;
    roleName: string | null;
    officeName: string | null;
    managerFirstName: string | null;
    managerLastName: string | null;
    setterTier: string | null;
  };

  const peopleList: PeopleRow[] = await db
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
      setterTier: people.setterTier,
    })
    .from(people)
    .leftJoin(roles, eq(people.roleId, roles.id))
    .leftJoin(offices, eq(people.officeId, offices.id))
    .leftJoin(manager, eq(people.reportsToId, manager.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(people.lastName, people.firstName);

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

  // Calculate stats
  const totalTeam = peopleList.length;
  const activeReps = peopleList.filter(
    (p) => p.status === "active" || !p.status
  ).length;
  const inOnboarding = peopleList.filter(
    (p) => p.status === "onboarding"
  ).length;
  const terminated = peopleList.filter((p) => p.status === "terminated").length;

  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case "active":
        return { bg: "bg-green-100", text: "text-green-700" };
      case "onboarding":
        return { bg: "bg-yellow-100", text: "text-yellow-700" };
      case "inactive":
        return { bg: "bg-gray-100", text: "text-gray-600" };
      case "terminated":
        return { bg: "bg-red-100", text: "text-red-700" };
      default:
        return { bg: "bg-green-100", text: "text-green-700" };
    }
  };

  const getTierStyle = (tier: string | null) => {
    switch (tier?.toLowerCase()) {
      case "team lead":
        return "text-indigo-600 font-bold";
      case "veteran":
        return "text-indigo-600 font-bold";
      case "rookie":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Team Management
          </h1>
          <p className="text-gray-500 font-medium">
            Manage your sales reps, managers, and office staff.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm text-sm font-bold hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link
            href="/people/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-sm text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Person
          </Link>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Team"
          value={totalTeam}
          icon={Users}
          trend="+3 this month"
          trendUp
        />
        <MetricCard
          label="Active Reps"
          value={activeReps}
          icon={Users}
          trend={`${Math.round((activeReps / totalTeam) * 100) || 0}% of total`}
          trendUp
        />
        <MetricCard
          label="In Onboarding"
          value={inOnboarding}
          icon={GraduationCap}
          trend="Avg 14 days"
          trendUp
        />
        <MetricCard
          label="Terminated"
          value={terminated}
          icon={UserX}
          trend="This month"
          trendUp={false}
        />
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          FILTERS
        </span>
        <select
          className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white"
          defaultValue={officeFilter || ""}
        >
          <option value="">OFFICE: ALL</option>
          {officesList.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white"
          defaultValue={roleFilter || ""}
        >
          <option value="">ROLE: ALL</option>
          {rolesList.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white"
          defaultValue={statusFilter || ""}
        >
          <option value="">STATUS: ALL</option>
          <option value="active">Active</option>
          <option value="onboarding">Onboarding</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
        <button className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <X className="w-3 h-3" /> CLEAR FILTERS
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Office
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Setter Tier
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Manager
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {peopleList.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No people found
                </td>
              </tr>
            ) : (
              peopleList.map((person) => {
                const statusStyle = getStatusStyle(person.status);
                const initials =
                  `${person.firstName?.[0] || ""}${person.lastName?.[0] || ""}`.toUpperCase();

                return (
                  <tr
                    key={person.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/people/${person.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                          {initials}
                        </div>
                        <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {person.firstName} {person.lastName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        {person.roleName || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {person.officeName || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`${statusStyle.bg} ${statusStyle.text} border-0 text-[10px] font-bold uppercase`}
                      >
                        {person.status || "active"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getTierStyle(person.setterTier)}>
                        {person.setterTier?.toUpperCase() || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {person.managerFirstName && person.managerLastName
                        ? `${person.managerFirstName} ${person.managerLastName}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-gray-100 rounded-sm transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
