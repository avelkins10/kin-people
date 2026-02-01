"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PeopleFiltersProps {
  offices: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; name: string }>;
}

export function PeopleFilters({ offices, roles }: PeopleFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const officeId = searchParams.get("office") || "";
  const roleId = searchParams.get("role") || "";
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to first page when filtering
    router.push(`/people?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/people");
  }

  const hasFilters = officeId || roleId || status || search;

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="text-sm font-medium mb-1 block">Search</label>
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
      </div>

      <div className="min-w-[180px]">
        <label className="text-sm font-medium mb-1 block">Office</label>
        <Select
          value={officeId}
          onValueChange={(value) => updateFilter("office", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All offices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All offices</SelectItem>
            {offices.map((office) => (
              <SelectItem key={office.id} value={office.id}>
                {office.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[180px]">
        <label className="text-sm font-medium mb-1 block">Role</label>
        <Select
          value={roleId}
          onValueChange={(value) => updateFilter("role", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[180px]">
        <label className="text-sm font-medium mb-1 block">Status</label>
        <Select
          value={status}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button variant="outline" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
}
