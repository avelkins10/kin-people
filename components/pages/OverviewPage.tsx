"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import { HiringVelocitySparkline } from "@/components/HiringVelocitySparkline";
import { RecruiterActivityFeed } from "@/components/RecruiterActivityFeed";
import {
  Users,
  UserPlus,
  GraduationCap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useModals } from "@/components/ModalsContext";
import { useDashboardStats, useOnboardingPeople, useRecruitingStats } from "@/hooks/use-dashboard-data";

const PIPELINE_STAGE_CONFIG: { key: string; name: string; color: string }[] = [
  { key: "lead", name: "Lead", color: "bg-gray-400" },
  { key: "contacted", name: "Contacted", color: "bg-blue-400" },
  { key: "interviewing", name: "Interviewing", color: "bg-indigo-500" },
  { key: "offer_sent", name: "Offer Sent", color: "bg-purple-500" },
  { key: "agreement", name: "Agreement", color: "bg-pink-500" },
  { key: "onboarding", name: "Onboarding", color: "bg-amber-500" },
];

interface DashboardStats {
  totalPeople: number;
  activeRecruits: number;
  pendingCommissions: number;
  recentDealsCount: number;
  pipelineStageCounts: Record<string, number>;
  onboardingCount: number;
}

interface OnboardingPerson {
  id: string;
  name: string;
  officeName: string | null;
  daysIn: number;
  progress: number;
}

export function OverviewPage() {
  const { openAddRecruit, navigateTo } = useModals();

  // Use React Query hooks - these run in parallel and cache results
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: onboardingData, isLoading: onboardingLoading } = useOnboardingPeople();
  const { data: recruitingStats, isLoading: recruitingLoading } = useRecruitingStats();

  // Process onboarding people data
  const onboardingPeople = useMemo(() => {
    if (!onboardingData) return [];
    const now = new Date();
    return onboardingData.slice(0, 5).map((p: any) => {
      const name = p.name ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
      const hireDate = p.hireDate ? new Date(p.hireDate) : null;
      const daysIn = hireDate
        ? Math.max(0, Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      const progress = Math.min(100, Math.round((daysIn / 14) * 100));
      return {
        id: p.id,
        name,
        officeName: p.officeName ?? null,
        daysIn,
        progress,
      };
    });
  }, [onboardingData]);

  const actionCount = recruitingStats?.actionItems?.length ?? null;

  const loading = statsLoading;
  const error = statsError ? (statsError as Error).message : null;

  const pipelineStages = PIPELINE_STAGE_CONFIG.map((cfg) => {
    let count = 0;
    if (cfg.key === "agreement" && stats?.pipelineStageCounts) {
      count =
        (stats.pipelineStageCounts["agreement_sent"] ?? 0) +
        (stats.pipelineStageCounts["agreement_signed"] ?? 0);
    } else {
      count = stats?.pipelineStageCounts?.[cfg.key] ?? 0;
    }
    return { ...cfg, count };
  });

  const totalInPipeline = pipelineStages.reduce((s, st) => s + st.count, 0);
  const maxCount = Math.max(1, ...pipelineStages.map((s) => s.count));

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500" aria-busy="true">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Recruiting & Onboarding
          </h1>
          <p className="text-gray-500 font-medium">
            Build your sales team from lead to field-ready rep.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={openAddRecruit}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Recruit
          </Button>
          <Button onClick={() => navigateTo("onboarding")}>
            <GraduationCap className="w-4 h-4 mr-2" />
            View Onboarding
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
          {error}
        </div>
      )}

      {actionCount != null && actionCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-sm mb-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">
              {actionCount} Item{actionCount !== 1 ? "s" : ""} Need Attention
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Recruits or onboarding items need follow-up.
            </p>
          </div>
          <button
            onClick={() => navigateTo("recruiting")}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center whitespace-nowrap"
          >
            View All <ChevronRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <MetricCard
          label="Active Recruits"
          value={stats?.activeRecruits ?? "—"}
          icon={UserPlus}
          trend="In pipeline"
          trendUp={true}
        />
        <MetricCard
          label="Conversion Rate"
          value="—"
          icon={TrendingUp}
          trend="Lead → Hired"
          trendUp={true}
        />
        <MetricCard
          label="In Onboarding"
          value={stats?.onboardingCount ?? "—"}
          icon={GraduationCap}
          trend="People"
          trendUp={true}
        />
        <MetricCard
          label="Avg Time to Hire"
          value="—"
          icon={Clock}
          trend="—"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 border border-gray-100 rounded-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold tracking-tight text-black uppercase">
                Recruiting Pipeline
              </h3>
              <button
                onClick={() => navigateTo("recruiting")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide flex items-center"
              >
                View Full Pipeline <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            </div>
            <div className="space-y-3">
              {pipelineStages.map((stage) => (
                <div key={stage.name} className="flex items-center gap-4">
                  <div className="w-24 text-xs font-bold text-gray-500 uppercase tracking-wide shrink-0">
                    {stage.name}
                  </div>
                  <div className="flex-1 h-8 bg-gray-50 rounded-sm overflow-hidden relative">
                    <div
                      className={`h-full ${stage.color} transition-all duration-500`}
                      style={{
                        width: `${(stage.count / maxCount) * 100}%`,
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-700">
                      {stage.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-2xl font-extrabold text-black">
                    {totalInPipeline}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase ml-2">
                    Total in Pipeline
                  </span>
                </div>
                <div className="h-8 w-px bg-gray-100" />
                <div className="flex items-center gap-2">
                  <HiringVelocitySparkline />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 border border-gray-100 rounded-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold tracking-tight text-black uppercase">
                Onboarding Progress
              </h3>
              <button
                onClick={() => navigateTo("onboarding")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide flex items-center"
              >
                View All <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            </div>
            <div className="space-y-4">
              {onboardingPeople.length === 0 ? (
                <p className="text-sm text-gray-500">No one in onboarding right now.</p>
              ) : (
                onboardingPeople.map((hire) => (
                  <div
                    key={hire.id}
                    onClick={() => navigateTo("onboarding")}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-sm hover:bg-gray-100 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {hire.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {hire.name}
                        </span>
                        <span className="text-xs font-bold text-indigo-600">
                          {hire.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${hire.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-500">
                          {hire.officeName ?? "—"}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            hire.daysIn > 10 ? "text-red-500" : "text-gray-400"
                          }`}
                        >
                          Day {hire.daysIn}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-xl font-extrabold text-black">
                  {stats?.onboardingCount ?? 0}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  In Onboarding
                </span>
              </div>
              <div>
                <span className="text-xl font-extrabold text-black">
                  {stats?.totalPeople ?? 0}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Total Team
                </span>
              </div>
              <div>
                <span className="text-xl font-extrabold text-green-600">
                  {stats?.recentDealsCount ?? 0}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Deals (30d)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <RecruiterActivityFeed />

          <div className="bg-[#0a0a0a] text-white p-6 rounded-sm">
            <h3 className="text-lg font-extrabold tracking-tight mb-6 uppercase">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={openAddRecruit}
                className="w-full text-left p-4 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-sm">Add New Recruit</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>
              <button
                onClick={() => navigateTo("recruiting")}
                className="w-full text-left p-4 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-sm">Convert to Person</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>
              <button
                onClick={() => navigateTo("onboarding")}
                className="w-full text-left p-4 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm">Schedule Training</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>
              <button
                onClick={() => navigateTo("people")}
                className="w-full text-left p-4 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-sm">Assign Mentor</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
