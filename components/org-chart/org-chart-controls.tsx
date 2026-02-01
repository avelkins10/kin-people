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
import { useRef, useCallback } from "react";

interface OrgChartControlsProps {
  offices: Array<{ id: string; name: string }>;
}

export function OrgChartControls({ offices }: OrgChartControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = searchParams.get("view") || "reports_to";
  const officeId = searchParams.get("office") || "";
  const search = searchParams.get("search") || "";
  const mode = searchParams.get("mode") || "tree";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/org-chart?${params.toString()}`);
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

  const hasFilters = officeId || search;

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="text-sm font-medium mb-1 block">Search</label>
        <Input
          placeholder="Search by name or email..."
          defaultValue={search}
          onChange={(e) => debouncedSearch(e.target.value)}
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

      {hasFilters && (
        <Button variant="outline" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
}
