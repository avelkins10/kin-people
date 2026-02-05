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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, ChevronDown, ChevronsUpDown, Expand, Shrink } from "lucide-react";
import { useRef, useCallback } from "react";
import type { PersonStatus, RoleLevelFilter, PersonData } from "@/types/org-chart";

const STATUS_OPTIONS: { value: PersonStatus; label: string; color: string }[] = [
  { value: "active", label: "Active", color: "bg-green-500" },
  { value: "onboarding", label: "Onboarding", color: "bg-yellow-500" },
  { value: "inactive", label: "Inactive", color: "bg-gray-400" },
  { value: "terminated", label: "Terminated", color: "bg-red-500" },
];

const ROLE_LEVEL_OPTIONS: { value: RoleLevelFilter; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "1", label: "Setters (Level 1)" },
  { value: "2", label: "Closers (Level 2)" },
  { value: "3+", label: "Leaders (Level 3+)" },
];

interface OrgChartControlsProps {
  offices: Array<{ id: string; name: string }>;
  people?: PersonData[];
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onFocusPerson?: (personId: string | null) => void;
  focusPersonId?: string | null;
}

export function OrgChartControls({
  offices,
  people = [],
  onExpandAll,
  onCollapseAll,
  onFocusPerson,
  focusPersonId,
}: OrgChartControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = searchParams.get("view") || "reports_to";
  const officeId = searchParams.get("office") || "_all";
  const search = searchParams.get("search") || "";
  const mode = searchParams.get("mode") || "tree";

  // Parse status filter from URL - default to active,onboarding
  const statusParam = searchParams.get("status");
  const selectedStatuses: PersonStatus[] = statusParam
    ? statusParam.split(",").filter((s) => STATUS_OPTIONS.some((o) => o.value === s)) as PersonStatus[]
    : ["active", "onboarding"];

  // Parse role level filter
  const roleLevel = (searchParams.get("roleLevel") || "all") as RoleLevelFilter;

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    // Treat "_all" and "_none" as empty values (clear the filter)
    if (value && value !== "_all" && value !== "_none") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/org-chart?${params.toString()}`);
  }

  function updateStatusFilter(status: PersonStatus, checked: boolean) {
    let newStatuses: PersonStatus[];
    if (checked) {
      newStatuses = [...selectedStatuses, status];
    } else {
      newStatuses = selectedStatuses.filter((s) => s !== status);
    }
    // If empty, default to showing all
    if (newStatuses.length === 0) {
      newStatuses = STATUS_OPTIONS.map((o) => o.value);
    }
    updateFilter("status", newStatuses.join(","));
  }

  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const debouncedSearch = useCallback((value: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      updateFilter("search", value);
    }, 300);
  }, []);

  function clearFilters() {
    router.push("/org-chart");
  }

  const hasFilters = officeId || search || roleLevel !== "all" || (statusParam && statusParam !== "active,onboarding");

  // Status label for the dropdown
  const statusLabel = selectedStatuses.length === STATUS_OPTIONS.length
    ? "All Statuses"
    : selectedStatuses.length === 0
      ? "No Status"
      : selectedStatuses.length === 1
        ? STATUS_OPTIONS.find((o) => o.value === selectedStatuses[0])?.label
        : `${selectedStatuses.length} statuses`;

  return (
    <div className="space-y-4">
      {/* First row: Search, Office, Status, Role */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-1 block">Search</label>
          <Input
            placeholder="Search by name or email..."
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>

        <div className="min-w-[160px]">
          <label className="text-sm font-medium mb-1 block">Office</label>
          <Select
            value={officeId}
            onValueChange={(value) => updateFilter("office", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All offices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All offices</SelectItem>
              {offices.map((office) => (
                <SelectItem key={office.id} value={office.id}>
                  {office.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[160px]">
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {statusLabel}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-3">
              <div className="space-y-2">
                {STATUS_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={selectedStatuses.includes(option.value)}
                      onCheckedChange={(checked) =>
                        updateStatusFilter(option.value, checked === true)
                      }
                    />
                    <div className={`w-2 h-2 rounded-full ${option.color}`} />
                    <label
                      htmlFor={`status-${option.value}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="min-w-[160px]">
          <label className="text-sm font-medium mb-1 block">Role Level</label>
          <Select
            value={roleLevel}
            onValueChange={(value) => updateFilter("roleLevel", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_LEVEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
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

      {/* Second row: View, Mode, Focus, Expand/Collapse */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex gap-2">
          <label className="text-sm font-medium mb-1 block w-full">View</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={view === "reports_to" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("view", "reports_to")}
            >
              Reports To
            </Button>
            <Button
              type="button"
              variant={view === "recruited_by" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("view", "recruited_by")}
            >
              Recruited By
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <label className="text-sm font-medium mb-1 block w-full">Mode</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "tree" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("mode", "tree")}
            >
              Tree
            </Button>
            <Button
              type="button"
              variant={mode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("mode", "list")}
            >
              List
            </Button>
          </div>
        </div>

        {/* Focus person selector */}
        {people.length > 0 && onFocusPerson && (
          <div className="min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">Focus On</label>
            <Select
              value={focusPersonId || "_none"}
              onValueChange={(value) => onFocusPerson(value === "_none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select person..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No focus</SelectItem>
                {people
                  .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                  .map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.firstName} {person.lastName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Expand/Collapse buttons - only show in tree mode */}
        {mode === "tree" && onExpandAll && onCollapseAll && (
          <div className="flex gap-2">
            <label className="text-sm font-medium mb-1 block w-full">Tree</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onExpandAll}
                title="Expand All"
              >
                <Expand className="h-4 w-4 mr-1" />
                Expand
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCollapseAll}
                title="Collapse All"
              >
                <Shrink className="h-4 w-4 mr-1" />
                Collapse
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
