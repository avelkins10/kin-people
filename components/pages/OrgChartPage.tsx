"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OrgChartControls } from "@/components/org-chart/org-chart-controls";
import { OrgTreeView } from "@/components/org-chart/org-tree-view";
import { OrgListView } from "@/components/org-chart/org-list-view";
import { buildOrgTree } from "@/lib/db/helpers/org-chart-helpers";
import type { PersonData, RelationshipType } from "@/types/org-chart";
import { GitBranch, Search, Loader2 } from "lucide-react";

export function OrgChartPage() {
  const searchParams = useSearchParams();
  const [people, setPeople] = useState<PersonData[]>([]);
  const [offices, setOffices] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const view = (searchParams.get("view") || "reports_to") as RelationshipType;
  const officeId = searchParams.get("office") || "";
  const search = searchParams.get("search") || "";
  const mode = searchParams.get("mode") || "tree";

  const fetchOffices = useCallback(async () => {
    try {
      const res = await fetch("/api/offices?active=true");
      if (res.ok) {
        const data = await res.json();
        setOffices(data.map((o: any) => ({ id: o.id, name: o.name })));
      }
    } catch {
      setOffices([]);
    }
  }, []);

  const fetchOrgChart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("view", view);
      if (officeId) params.set("office", officeId);
      if (search) params.set("search", search);
      const res = await fetch(`/api/org-chart?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load org chart");
      }
      const data = await res.json();
      setPeople(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load org chart");
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [view, officeId, search]);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  useEffect(() => {
    fetchOrgChart();
  }, [fetchOrgChart]);

  const tree = buildOrgTree(people, view);

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Organization Chart
          </h1>
          <p className="text-gray-500 font-medium">
            Visualize team hierarchy and reporting structure.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <a href="#search">
              <Search className="w-4 h-4 mr-2" />
              Find Person
            </a>
          </Button>
          <Button variant="outline">
            <GitBranch className="w-4 h-4 mr-2" />
            Export Chart
          </Button>
        </div>
      </header>

      <div id="search" className="mb-6">
        <OrgChartControls offices={offices} />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="flex items-center justify-center py-24 text-gray-500 min-h-[400px]"
          aria-busy="true"
        >
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          Loading org chart…
        </div>
      ) : people.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 rounded-sm p-12 text-center text-gray-500 min-h-[400px] flex items-center justify-center">
          No people match your filters. Try adjusting the office or search.
        </div>
      ) : mode === "list" ? (
        <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
          <OrgListView people={people} relationshipType={view} />
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-sm p-6 overflow-auto min-h-[600px]">
          <OrgTreeView
            tree={tree}
            searchQuery={search || undefined}
            relationshipType={view}
          />
        </div>
      )}
    </>
  );
}
