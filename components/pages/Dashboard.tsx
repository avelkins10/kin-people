"use client";

import React, { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExpiredDocumentsBanner } from "@/components/documents/expired-documents-banner";
import { RecruitingKanban } from "@/components/recruiting/recruiting-kanban";
import { RecruitingTable } from "@/components/recruiting/recruiting-table";
import { Button } from "@/components/ui/button";
import { Plus, UserCheck, LayoutGrid, List, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { useModals } from "@/components/ModalsContext";
import type { RecruitListItem } from "@/types/recruiting";
import { useRecruits } from "@/hooks/use-recruiting-data";
import { useRecruitingStats } from "@/hooks/use-dashboard-data";
import { usePeople, useOffices } from "@/hooks/use-people-data";

const PIPELINE_STATUSES = [
  "lead",
  "contacted",
  "interviewing",
  "offer_sent",
  "agreement_sent",
  "agreement_signed",
] as const;

type ViewMode = "kanban" | "list";

export function Dashboard() {
  const { openAddRecruit } = useModals();
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const recruiterId = searchParams.get("recruiterId") ?? "";
  const officeId = searchParams.get("officeId") ?? "";
  const expiredDocuments = searchParams.get("expiredDocuments") ?? "";
  const viewParam = searchParams.get("view");
  const viewMode: ViewMode =
    viewParam === "list" ? "list" : "kanban";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/recruiting?${params.toString()}`);
    },
    [router, searchParams]
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (mode === "list") params.set("view", "list");
      else params.delete("view");
      router.push(`/recruiting?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Use React Query hooks - these cache and deduplicate requests
  const {
    data: recruits = [],
    isLoading: loading,
    error: queryError,
    refetch: refetchRecruits
  } = useRecruits({
    status: status || undefined,
    recruiterId: recruiterId || undefined,
    officeId: officeId || undefined,
  });

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useRecruitingStats();
  const { data: offices = [] } = useOffices();
  const { data: people = [] } = usePeople({});

  const error = queryError ? (queryError as Error).message : null;

  // Handle recruits-updated event for refetching
  useEffect(() => {
    const handler = () => {
      refetchRecruits();
      refetchStats();
    };
    window.addEventListener("recruits-updated", handler);
    return () => window.removeEventListener("recruits-updated", handler);
  }, [refetchRecruits, refetchStats]);

  const actionItems = stats?.actionItems ?? [];
  const inPipeline = stats?.inPipeline ?? 0;
  const startingSoon = stats?.startingSoonCount ?? 0;

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Recruiting Pipeline
          </h1>
          <p className="text-gray-500 font-medium">
            Manage your sales team growth from lead to certified rep.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/recruiting")}>
            <UserCheck className="w-4 h-4 mr-2" />
            Convert to Person
          </Button>
          <Button onClick={openAddRecruit}>
            <Plus className="w-4 h-4 mr-2" />
            Add Recruit
          </Button>
        </div>
      </header>

      <ExpiredDocumentsBanner
        onReview={() => updateFilter("expiredDocuments", "true")}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <div className="bg-[#0a0a0a] text-white p-5 rounded-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-bold tracking-wide uppercase">
              Active Recruits
            </span>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-extrabold tracking-tighter leading-none mb-2">
              {loading ? "—" : inPipeline}
            </div>
            <div className="text-[10px] font-medium text-gray-400">
              In pipeline
            </div>
          </div>
        </div>
        <div className="bg-[#0a0a0a] text-white p-5 rounded-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-bold tracking-wide uppercase">
              Starting Soon
            </span>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-extrabold tracking-tighter leading-none mb-2">
              {loading ? "—" : startingSoon}
            </div>
            <div className="text-[10px] font-medium text-gray-400">
              Agreement signed / Onboarding
            </div>
          </div>
        </div>
        <div className="bg-[#0a0a0a] text-white p-5 rounded-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-bold tracking-wide uppercase">
              In Pipeline (view)
            </span>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-extrabold tracking-tighter leading-none mb-2">
              {loading ? "—" : recruits.length}
            </div>
            <div className="text-[10px] font-medium text-gray-400">
              After filters
            </div>
          </div>
        </div>
        <div className="bg-[#0a0a0a] text-white p-5 rounded-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-bold tracking-wide uppercase">
              Action Items
            </span>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-extrabold tracking-tighter leading-none mb-2">
              {actionItems.length}
            </div>
            <div className="text-[10px] font-medium text-gray-400">
              Need attention
            </div>
          </div>
        </div>
      </div>

      {actionItems.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-sm mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">
              {actionItems.length} Candidate{actionItems.length !== 1 ? "s" : ""} Need Attention
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {actionItems
                .slice(0, 3)
                .map((a) => a.message)
                .join(" • ")}
              {actionItems.length > 3 ? ` • +${actionItems.length - 3} more` : ""}
            </p>
          </div>
          <button
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center whitespace-nowrap"
            onClick={() => router.push("/recruiting")}
          >
            View Pipeline <ChevronRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0">
        <div className="flex flex-wrap gap-3 p-4 bg-white border border-gray-100 rounded-sm flex-1">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500 self-center mr-2">
            Filters
          </span>
          <select
            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide"
            value={status}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="">Status: All</option>
            {PIPELINE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
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
            value={recruiterId}
            onChange={(e) => updateFilter("recruiterId", e.target.value)}
          >
            <option value="">Recruiter: All</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={expiredDocuments === "true"}
              onChange={(e) =>
                updateFilter("expiredDocuments", e.target.checked ? "true" : "")
              }
              className="rounded border-gray-300"
              aria-label="Filter by expired documents"
            />
            Expired Documents
          </label>
        </div>
        <div className="flex items-center bg-white border border-gray-100 rounded-sm p-1 h-fit self-start sm:self-center">
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-all ${
              viewMode === "kanban" ? "bg-black text-white" : "text-gray-500 hover:text-black hover:bg-gray-50"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-all ${
              viewMode === "list" ? "bg-black text-white" : "text-gray-500 hover:text-black hover:bg-gray-50"
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500" aria-busy="true">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            Loading pipeline…
          </div>
        ) : viewMode === "kanban" ? (
          <RecruitingKanban initialRecruits={recruits} />
        ) : (
          <RecruitingTable initialRecruits={recruits} />
        )}
      </div>
    </>
  );
}
