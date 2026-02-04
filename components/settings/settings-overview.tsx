"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Users,
  MapPin,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
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
    tab: "offices",
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
  className,
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-gray-900 rounded-sm p-4 transition-all duration-150 hover:bg-gray-800",
        className
      )}
    >
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-extrabold text-white">{value}</p>
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
    <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-bold text-sm text-amber-800">
            {count} {count === 1 ? "person" : "people"} without pay plans
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            These users won&apos;t receive commission calculations
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onAction}
        className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
      >
        Review
        <ArrowRight className="w-4 h-4 ml-1" />
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
        "flex flex-col items-center justify-center p-4 rounded-sm",
        "bg-gray-50 border border-transparent",
        "transition-all duration-150",
        "hover:bg-white hover:border-gray-200 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "group"
      )}
    >
      <div className="p-3 bg-indigo-50 rounded-sm mb-3 transition-colors group-hover:bg-indigo-100">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600">
        {action.label}
      </span>
      <span className="text-xs text-gray-500 mt-0.5 text-center">
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
    <div className="flex items-start gap-3 py-2">
      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 truncate">{summary}</p>
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
    <div className="space-y-6">
      {/* Alert Banner */}
      <AlertBanner
        count={peopleWithoutPayPlans}
        onAction={() => handleNavigate("users")}
      />

      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Users" value={totalUsers} />
        <MetricCard label="Offices" value={totalOffices} />
        <MetricCard label="Pay Plans" value={activePayPlans} />
        <MetricCard label="Commission Rules" value={totalCommissionRules} />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="bg-white border border-gray-100 rounded-sm p-6 transition-all duration-150 hover:border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-sm">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
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
        <div className="bg-white border border-gray-100 rounded-sm p-6 transition-all duration-150 hover:border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-sm">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
                Recent Changes
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate("history")}
              className="text-gray-500 hover:text-indigo-600"
            >
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-1">
            {loadingActivity ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-3/4 bg-gray-200 rounded" />
                      <div className="h-3 w-1/2 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
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
