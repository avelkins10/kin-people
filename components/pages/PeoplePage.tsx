"use client";

import React, { useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Plus,
  Download,
  Filter,
  MoreHorizontal,
  MapPin,
  Shield,
  Loader2,
} from "lucide-react";
import { usePeople, useOffices, useRoles } from "@/hooks/use-people-data";

type PersonStatus = "active" | "onboarding" | "inactive" | "terminated";
type SetterTier = "Rookie" | "Veteran" | "Team Lead" | null;

interface PersonRow {
  id: string;
  name: string;
  roleName: string | null;
  officeName: string | null;
  status: string | null;
  setterTier: string | null;
  managerName: string | null;
}

function getStatusDisplay(status: string | null): string {
  if (!status) return "—";
  const s = status.toLowerCase();
  if (s === "active") return "Active";
  if (s === "onboarding") return "Onboarding";
  if (s === "inactive") return "Inactive";
  if (s === "terminated") return "Terminated";
  return status;
}

function getStatusStyles(status: string | null): string {
  const s = (status || "").toLowerCase();
  if (s === "active") return "bg-green-100 text-green-700 border-green-200";
  if (s === "onboarding") return "bg-amber-100 text-amber-700 border-amber-200";
  if (s === "inactive") return "bg-gray-100 text-gray-600 border-gray-200";
  if (s === "terminated") return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

function getTierStyles(tier: string | null): string {
  if (!tier) return "text-gray-500";
  if (tier === "Team Lead") return "text-indigo-600 font-extrabold";
  if (tier === "Veteran") return "text-blue-600 font-bold";
  if (tier === "Rookie") return "text-gray-500 font-medium";
  return "text-gray-500";
}

function exportToCsv(people: PersonRow[]) {
  const headers = ["Name", "Role", "Office", "Status", "Setter Tier", "Manager"];
  const rows = people.map((p) => [
    p.name,
    p.roleName ?? "",
    p.officeName ?? "",
    getStatusDisplay(p.status),
    p.setterTier ?? "",
    p.managerName ?? "",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `people-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PeoplePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const officeId = searchParams.get("officeId") ?? "";
  const status = searchParams.get("status") ?? "";
  const roleLevel = searchParams.get("roleLevel") ?? "";
  const roleId = searchParams.get("roleId") ?? "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/people?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Use React Query hooks - these cache and deduplicate requests
  const {
    data: peopleData,
    isLoading: loading,
    error: queryError
  } = usePeople({
    officeId: officeId || undefined,
    status: status || undefined,
    roleId: roleId || undefined,
  });

  const { data: offices = [] } = useOffices();
  const { data: roles = [] } = useRoles();

  const error = queryError ? (queryError as Error).message : null;

  // Transform people data
  const people = useMemo(() => {
    if (!peopleData) return [];
    return peopleData.map((p: any) => ({
      id: p.id,
      name: p.name ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
      roleName: p.roleName ?? null,
      officeName: p.officeName ?? null,
      status: p.status ?? null,
      setterTier: p.setterTier ?? null,
      managerName: p.managerName ?? null,
    }));
  }, [peopleData]);

  const total = people.length;
  const activeCount = people.filter((p) => (p.status || "").toLowerCase() === "active").length;
  const onboardingCount = people.filter((p) => (p.status || "").toLowerCase() === "onboarding").length;
  const terminatedCount = people.filter((p) => (p.status || "").toLowerCase() === "terminated").length;

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Team Management
          </h1>
          <p className="text-gray-500 font-medium">
            Manage your sales reps, managers, and office staff.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => exportToCsv(people)}
            disabled={loading || people.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button asChild>
            <Link href="/people/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Person
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <MetricCard
          label="Total Team"
          value={loading ? "—" : total}
          icon={Users}
          trend={total ? `${activeCount} active` : "No data"}
          trendUp={true}
        />
        <MetricCard
          label="Active Reps"
          value={loading ? "—" : activeCount}
          icon={UserCheck}
          trend={total ? `${total ? Math.round((activeCount / total) * 100) : 0}% of total` : "—"}
          trendUp={true}
        />
        <MetricCard
          label="In Onboarding"
          value={loading ? "—" : onboardingCount}
          icon={GraduationCap}
          trend="Onboarding"
          trendUp={true}
        />
        <MetricCard
          label="Terminated"
          value={loading ? "—" : terminatedCount}
          icon={UserX}
          trend="Terminated"
          trendUp={false}
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white border border-gray-100 rounded-sm">
        <div className="flex items-center gap-2 text-gray-500 mr-2">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Filters</span>
        </div>
        <select
          className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide"
          value={officeId}
          onChange={(e) => updateFilter("officeId", e.target.value)}
        >
          <option value="">Office: All</option>
          {offices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select
          className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide"
          value={roleLevel || roleId || ""}
          onChange={(e) => {
            const v = e.target.value;
            const params = new URLSearchParams(searchParams.toString());
            if (v === "manager") {
              params.set("roleLevel", "manager");
              params.delete("roleId");
            } else if (v) {
              params.set("roleId", v);
              params.delete("roleLevel");
            } else {
              params.delete("roleLevel");
              params.delete("roleId");
            }
            router.push(`/people?${params.toString()}`);
          }}
        >
          <option value="">Role: All</option>
          <option value="manager">Managers only</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide"
          value={status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="">Status: All</option>
          <option value="active">Active</option>
          <option value="onboarding">Onboarding</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500" aria-busy="true">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              Loading people…
            </div>
          ) : people.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              No people match your filters. Try adjusting filters or add a person.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Office
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Setter Tier
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {people.map((person) => (
                  <tr
                    key={person.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/people/${person.id}`}
                        className="flex items-center gap-3 font-bold text-black hover:text-indigo-600"
                      >
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {person.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        {person.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-700">
                          {person.roleName ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-700">
                          {person.officeName ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-sm uppercase tracking-wide border ${getStatusStyles(person.status)}`}
                      >
                        {getStatusDisplay(person.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs uppercase tracking-wide ${getTierStyles(person.setterTier)}`}
                      >
                        {person.setterTier ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.managerName ?? "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/people/${person.id}`}
                        className="text-gray-400 hover:text-black transition-colors inline-flex"
                        aria-label={`View ${person.name}`}
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
