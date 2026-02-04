"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OrgChartControls } from "@/components/org-chart/org-chart-controls";
import { OrgTreeView } from "@/components/org-chart/org-tree-view";
import { OrgListView } from "@/components/org-chart/org-list-view";
import { buildOrgTree } from "@/lib/db/helpers/org-chart-helpers";
import type { PersonData, RelationshipType, OrgTreeNode } from "@/types/org-chart";
import { Download, Search, Loader2 } from "lucide-react";

// Helper to collect all node IDs from tree
function collectAllNodeIds(nodes: OrgTreeNode[]): string[] {
  const ids: string[] = [];
  nodes.forEach((node) => {
    ids.push(node.person.id);
    ids.push(...collectAllNodeIds(node.children));
  });
  return ids;
}

// Helper to generate CSV from people data
function generateCSV(people: PersonData[], view: RelationshipType): string {
  const headers = [
    "Name",
    "Email",
    "Role",
    "Role Level",
    "Office",
    "Status",
    "Direct Reports",
    view === "reports_to" ? "Reports To ID" : "Recruited By ID",
  ];

  const rows = people.map((p) => [
    `${p.firstName} ${p.lastName}`,
    p.email,
    p.roleName || "",
    p.roleLevel?.toString() || "",
    p.officeName || "",
    p.status || "",
    p.directReportCount.toString(),
    (view === "reports_to" ? p.reportsToId : p.recruitedById) || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

export function OrgChartPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [people, setPeople] = useState<PersonData[]>([]);
  const [allPeople, setAllPeople] = useState<PersonData[]>([]); // For focus mode selector
  const [offices, setOffices] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lift expanded state to page level
  const [expandedNodes, setExpandedNodes] = useState<Map<string, boolean>>(new Map());

  const view = (searchParams.get("view") || "reports_to") as RelationshipType;
  const officeId = searchParams.get("office") || "";
  const search = searchParams.get("search") || "";
  const mode = searchParams.get("mode") || "tree";
  const statusParam = searchParams.get("status") || "active,onboarding";
  const roleLevel = searchParams.get("roleLevel") || "all";
  const focusPersonId = searchParams.get("focus") || null;

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

  // Fetch all people for focus mode selector (only active/onboarding)
  const fetchAllPeople = useCallback(async () => {
    try {
      const res = await fetch("/api/org-chart?status=active,onboarding");
      if (res.ok) {
        const data = await res.json();
        setAllPeople(Array.isArray(data) ? data : []);
      }
    } catch {
      setAllPeople([]);
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
      if (statusParam) params.set("status", statusParam);
      if (roleLevel && roleLevel !== "all") params.set("roleLevel", roleLevel);
      if (focusPersonId) params.set("focus", focusPersonId);
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
  }, [view, officeId, search, statusParam, roleLevel, focusPersonId]);

  useEffect(() => {
    fetchOffices();
    fetchAllPeople();
  }, [fetchOffices, fetchAllPeople]);

  useEffect(() => {
    fetchOrgChart();
  }, [fetchOrgChart]);

  const tree = useMemo(() => buildOrgTree(people, view), [people, view]);

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    const allIds = collectAllNodeIds(tree);
    const newExpanded = new Map<string, boolean>();
    allIds.forEach((id) => newExpanded.set(id, true));
    setExpandedNodes(newExpanded);
  }, [tree]);

  // Collapse all nodes
  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Map());
  }, []);

  // Handle focus person change
  const handleFocusPerson = useCallback((personId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (personId) {
      params.set("focus", personId);
    } else {
      params.delete("focus");
    }
    router.push(`/org-chart?${params.toString()}`);
  }, [searchParams, router]);

  // Handle CSV export
  const handleExport = useCallback(() => {
    const csv = generateCSV(people, view);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `org-chart-${view}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [people, view]);

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
          <Button variant="outline" onClick={handleExport} disabled={people.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </header>

      <div id="search" className="mb-6">
        <OrgChartControls
          offices={offices}
          people={allPeople}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onFocusPerson={handleFocusPerson}
          focusPersonId={focusPersonId}
        />
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
          No people match your filters. Try adjusting the office, status, or search.
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
            expandedNodes={expandedNodes}
            onExpandedNodesChange={setExpandedNodes}
            focusPersonId={focusPersonId}
          />
        </div>
      )}
    </>
  );
}
