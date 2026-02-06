"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Users,
  MapPin,
  FileText,
  Plus,
  ArrowRight,
  Clock,
  Building2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActivityLogEntry } from "./SettingsHistorySection";

interface SettingsOverviewProps {
  activePayPlans: number;
  totalCommissionRules: number;
  peopleWithoutPayPlans?: number;
  totalUsers?: number;
  totalOffices?: number;
  onNavigate?: (tab: string) => void;
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  tab: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Add User",
    icon: Users,
    tab: "users",
    description: "Create a new user account",
  },
  {
    label: "Add Office",
    icon: MapPin,
    tab: "org-structure",
    description: "Set up a new office location",
  },
  {
    label: "Add Pay Plan",
    icon: FileText,
    tab: "pay-plans",
    description: "Define compensation rules",
  },
  {
    label: "View History",
    icon: Clock,
    tab: "history",
    description: "See recent changes",
  },
];

function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: number | string;
  icon?: React.ElementType;
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800",
        "rounded-xl p-5 transition-all duration-200",
        "hover:shadow-lg hover:shadow-gray-900/20 hover:scale-[1.02]",
        "group cursor-default",
        className
      )}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          {Icon && (
            <Icon className="w-4 h-4 text-gray-500 group-hover:text-emerald-500 transition-colors duration-200" />
          )}
        </div>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className={cn(
              "w-3 h-3",
              trend === "up" && "text-emerald-400",
              trend === "down" && "text-red-400 rotate-180",
              trend === "neutral" && "text-gray-500"
            )} />
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertBanner({
  count,
  onAction,
}: {
  count: number;
  onAction: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-5 flex items-center justify-between gap-4">
      {/* Decorative element */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-200/20 rounded-full blur-2xl" />

      <div className="flex items-center gap-4 relative">
        <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200/50 rounded-xl ring-1 ring-amber-200/50">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-sm text-amber-900">
            {count} {count === 1 ? "person" : "people"} without pay plans
          </p>
          <p className="text-xs text-amber-700/70 mt-0.5">
            These users won&apos;t receive commission calculations
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onAction}
        className="border-amber-300 text-amber-800 bg-white/80 hover:bg-amber-100 hover:text-amber-900 hover:border-amber-400 transition-all duration-200 font-medium shrink-0"
      >
        Review
        <ArrowRight className="w-4 h-4 ml-1.5" />
      </Button>
    </div>
  );
}

function QuickActionCard({
  action,
  onClick,
}: {
  action: QuickAction;
  onClick: () => void;
}) {
  const Icon = action.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-5 rounded-xl",
        "bg-gray-50/80 border border-transparent",
        "transition-all duration-200",
        "hover:bg-white hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        "active:scale-[0.98]",
        "group"
      )}
    >
      <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl mb-3 transition-all duration-200 group-hover:from-emerald-100 group-hover:to-emerald-50 ring-1 ring-emerald-100/50">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors duration-200">
        {action.label}
      </span>
      <span className="text-xs text-gray-500 mt-1 text-center leading-relaxed">
        {action.description}
      </span>
    </button>
  );
}

function formatActivitySummary(entry: ActivityLogEntry): string {
  const typeLabels: Record<string, string> = {
    office: "office",
    role: "role",
    team: "team",
    pay_plan: "pay plan",
    commission_rule: "commission rule",
  };

  const action = entry.action.charAt(0).toUpperCase() + entry.action.slice(1);
  const type = typeLabels[entry.entityType] ?? entry.entityType;
  const name =
    (entry.details?.name as string) ??
    (entry.details?.new as { name?: string })?.name;

  return name ? `${action} ${type} "${name}"` : `${action} ${type}`;
}

function RecentActivityItem({ entry }: { entry: ActivityLogEntry }) {
  const summary = formatActivitySummary(entry);
  const when = entry.createdAt
    ? new Date(entry.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="flex items-start gap-3 py-3 group">
      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 group-hover:scale-125 transition-transform duration-200" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 truncate font-medium">{summary}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {entry.actorName && `${entry.actorName} · `}
          {when}
        </p>
      </div>
    </div>
  );
}

export function SettingsOverview({
  activePayPlans,
  totalCommissionRules,
  peopleWithoutPayPlans = 0,
  totalUsers = 0,
  totalOffices = 0,
  onNavigate,
}: SettingsOverviewProps) {
  const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/activity-log?limit=5")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setRecentActivity(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingActivity(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavigate = (tab: string) => {
    onNavigate?.(tab);
  };

  return (
    <div className="space-y-8">
      {/* Alert Banner */}
      <AlertBanner
        count={peopleWithoutPayPlans}
        onAction={() => handleNavigate("users")}
      />

      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Users" value={totalUsers} icon={Users} />
        <MetricCard label="Offices" value={totalOffices} icon={Building2} />
        <MetricCard label="Pay Plans" value={activePayPlans} icon={FileText} />
        <MetricCard label="Commission Rules" value={totalCommissionRules} icon={TrendingUp} />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm shadow-gray-100/50 transition-all duration-200 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/80">
          <div className="flex items-center gap-4 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg">
              <Plus className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 tracking-tight">
              Quick Actions
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.tab}
                action={action}
                onClick={() => handleNavigate(action.tab)}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm shadow-gray-100/50 transition-all duration-200 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/80">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 tracking-tight">
                Recent Changes
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate("history")}
              className="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 font-medium transition-all duration-200"
            >
              View all
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
          <div className="space-y-0 divide-y divide-gray-100">
            {loadingActivity ? (
              <div className="space-y-4 animate-pulse py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-100 rounded-md" />
                      <div className="h-3 w-1/2 bg-gray-100 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">
                No recent changes recorded
              </p>
            ) : (
              recentActivity.map((entry) => (
                <RecentActivityItem key={entry.id} entry={entry} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
