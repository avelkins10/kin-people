"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import { useOnboardingTasks, useToggleOnboardingTask } from "@/hooks/use-onboarding-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  GraduationCap,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Shield,
  MoreHorizontal,
  ChevronRight,
  Loader2,
  Mail,
  ClipboardList,
} from "lucide-react";

interface OnboardingRep {
  id: string;
  name: string;
  email: string;
  hireDate: string;
  manager: string;
  office: string;
  team: string;
  setterTier: string;
  daysInOnboarding: number;
}

interface PersonalInfoField {
  fieldId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  category: string | null;
  value: string | null;
  submittedAt: string | null;
}

interface PersonalInfoResponse {
  fields: PersonalInfoField[];
  stats: {
    totalFields: number;
    completedFields: number;
    requiredFields: number;
    completedRequired: number;
    isComplete: boolean;
  };
}

interface PeopleApiRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  name?: string;
  hireDate: string | null;
  officeName: string | null;
  managerName: string | null;
  setterTier: string | null;
}

interface OnboardingMetricsConfig {
  trainingComplete: { label: string; type: "count" | "percentage" | "placeholder"; count?: number; percentage?: number };
  readyForField: { label: string; type: "count" | "percentage" | "placeholder"; count?: number; percentage?: number };
}

function formatHireDate(hireDate: string | null): string {
  if (!hireDate) return "—";
  const d = new Date(hireDate);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function mapPersonToRep(row: PeopleApiRow): OnboardingRep {
  const rawName = row.name ?? `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
  const name = rawName || "—";
  const hireDateStr = row.hireDate ?? null;
  const daysInOnboarding = daysSince(hireDateStr);
  return {
    id: row.id,
    name,
    email: row.email ?? "",
    hireDate: formatHireDate(hireDateStr),
    manager: row.managerName ?? "—",
    office: row.officeName ?? "—",
    team: "—",
    setterTier: row.setterTier ?? "Rookie",
    daysInOnboarding,
  };
}

function metricValue(
  type: "count" | "percentage" | "placeholder",
  count?: number,
  percentage?: number
): string {
  if (type === "placeholder") return "—";
  if (type === "count") return String(count ?? 0);
  if (type === "percentage") return `${percentage ?? 0}%`;
  return "—";
}

function OnboardingCard({ rep, personId }: { rep: OnboardingRep; personId: string }) {
  const { data: onboardingData } = useOnboardingTasks(personId);
  const toggleTask = useToggleOnboardingTask();
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoResponse | null>(null);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  const tasks = onboardingData?.tasks ?? [];
  const completedCount = onboardingData?.completedCount ?? 0;
  const totalCount = onboardingData?.totalCount ?? 0;
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const isStale = rep.daysInOnboarding > 14;

  async function fetchPersonalInfo() {
    try {
      const res = await fetch(`/api/people/${personId}/onboarding-info`);
      if (res.ok) {
        const data = await res.json();
        setPersonalInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch personal info:", error);
    }
  }

  async function handleSendReminder() {
    if (!rep.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "This person has no email address",
      });
      return;
    }

    setSendingReminder(true);
    try {
      const res = await fetch(`/api/people/${personId}/onboarding/send-reminder`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to send reminder");
      }
      toast({
        title: "Reminder sent",
        description: `Email sent to ${rep.email}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reminder",
      });
    } finally {
      setSendingReminder(false);
    }
  }

  function openPersonalInfo() {
    fetchPersonalInfo();
    setShowPersonalInfo(true);
  }

  const pendingTaskCount = totalCount - completedCount;
  const hasPersonalInfo = personalInfo?.stats?.completedFields && personalInfo.stats.completedFields > 0;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-sm p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group relative">
        {isStale && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-sm uppercase tracking-wide">
            Stale
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shrink-0">
              {rep.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "—"}
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                {rep.name}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">Hired {rep.hireDate}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="text-gray-400 hover:text-black" aria-label="More options">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openPersonalInfo}>
                <ClipboardList className="w-4 h-4 mr-2" />
                View Personal Info
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSendReminder}
                disabled={sendingReminder || pendingTaskCount === 0}
              >
                <Mail className="w-4 h-4 mr-2" />
                {sendingReminder ? "Sending..." : "Send Reminder"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-xs">
          <div className="flex items-center text-gray-600">
            <Shield className="w-3 h-3 mr-1.5 text-gray-400 shrink-0" />
            {rep.manager}
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-3 h-3 mr-1.5 text-gray-400 shrink-0" />
            {rep.office}
          </div>
          <div className="flex items-center text-gray-600">
            <User className="w-3 h-3 mr-1.5 text-gray-400 shrink-0" />
            {rep.team}
          </div>
          <div className="flex items-center">
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm font-bold uppercase text-[10px]">
              {rep.setterTier}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs font-bold uppercase text-gray-500">Progress</span>
            <span className="text-xs font-bold text-indigo-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {tasks.slice(0, 3).map((task) => (
            <label key={task.id} className="flex items-center text-xs cursor-pointer hover:bg-gray-50 -mx-1 px-1 py-1 rounded transition-colors">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask.mutate({ personId, taskId: task.id })}
                disabled={toggleTask.isPending}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-sm border mr-2 flex items-center justify-center shrink-0 transition-colors ${
                  task.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
                } ${toggleTask.isPending ? "opacity-50" : ""}`}
              >
                {task.completed && <CheckCircle className="w-3 h-3" />}
              </div>
              <span
                className={
                  task.completed ? "text-gray-400 line-through" : "text-gray-700 font-medium"
                }
              >
                {task.title}
              </span>
            </label>
          ))}
          {tasks.length > 3 && (
            <div className="text-xs text-gray-400 pl-6">+ {tasks.length - 3} more tasks</div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div
            className={`flex items-center text-xs font-bold ${
              isStale ? "text-red-500" : "text-gray-400"
            }`}
          >
            <Clock className="w-3 h-3 mr-1 shrink-0" />
            {rep.daysInOnboarding} days
          </div>
          <Link
            href={`/people/${rep.id}`}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            View Details <ChevronRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>

      {/* Personal Info Dialog */}
      <Dialog open={showPersonalInfo} onOpenChange={setShowPersonalInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Personal Info: {rep.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {!personalInfo ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : personalInfo.fields.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No personal info fields configured. Go to Settings &gt; Onboarding to add fields.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-500 pb-2 border-b">
                  <span>
                    {personalInfo.stats.completedFields} of {personalInfo.stats.totalFields} fields completed
                  </span>
                  {personalInfo.stats.isComplete ? (
                    <span className="text-green-600 font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">
                      {personalInfo.stats.requiredFields - personalInfo.stats.completedRequired} required remaining
                    </span>
                  )}
                </div>
                {/* Group by category */}
                {Object.entries(
                  personalInfo.fields.reduce((acc, field) => {
                    const cat = field.category || "Other";
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(field);
                    return acc;
                  }, {} as Record<string, PersonalInfoField[]>)
                ).map(([category, fields]) => (
                  <div key={category}>
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">
                      {category === "uniform" ? "Uniform / Sizing" :
                       category === "emergency" ? "Emergency Contact" :
                       category === "personal" ? "Personal Info" :
                       category === "tax" ? "Tax Info" :
                       category === "benefits" ? "Benefits" : category}
                    </h4>
                    <div className="space-y-2">
                      {fields.map((field) => (
                        <div key={field.fieldId} className="flex justify-between items-start text-sm">
                          <span className="text-gray-600">{field.fieldLabel}</span>
                          <span className={field.value ? "font-medium text-gray-900" : "text-gray-400 italic"}>
                            {field.value || "Not provided"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function OnboardingPage() {
  const [reps, setReps] = useState<OnboardingRep[]>([]);
  const [stats, setStats] = useState<{ byStatus?: Record<string, number> } | null>(null);
  const [metricsConfig, setMetricsConfig] = useState<OnboardingMetricsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [peopleRes, statsRes, configRes] = await Promise.all([
        fetch("/api/people?status=onboarding"),
        fetch("/api/recruiting/stats"),
        fetch("/api/settings/onboarding-metrics"),
      ]);

      if (!peopleRes.ok) {
        const err = await peopleRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to load people");
      }
      const peopleData = await peopleRes.json();
      const peopleList = Array.isArray(peopleData) ? peopleData : [];
      setReps(peopleList.map((row: PeopleApiRow) => mapPersonToRep(row)));

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setStats(null);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setMetricsConfig(configData);
      } else {
        setMetricsConfig(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
      setReps([]);
      setStats(null);
      setMetricsConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const agreementSigned = stats?.byStatus?.agreement_signed ?? 0;
  const inOnboarding = reps.length;
  const blockedReps = reps.filter((r) => r.daysInOnboarding > 14);
  const trainingLabel = metricsConfig?.trainingComplete?.label ?? "Training Complete";
  const trainingType = metricsConfig?.trainingComplete?.type ?? "placeholder";
  const trainingCount = metricsConfig?.trainingComplete?.count ?? 0;
  const trainingPercentage = metricsConfig?.trainingComplete?.percentage ?? 0;
  const readyLabel = metricsConfig?.readyForField?.label ?? "Ready for Field";
  const readyType = metricsConfig?.readyForField?.type ?? "placeholder";
  const readyCount = metricsConfig?.readyForField?.count ?? 0;
  const readyPercentage = metricsConfig?.readyForField?.percentage ?? 0;

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Onboarding Tracker
          </h1>
          <p className="text-gray-500 font-medium">
            Track new hire progress from agreement to first sale.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" type="button">
            <User className="w-4 h-4 mr-2" />
            Assign Mentor
          </Button>
          <Button type="button">
            <GraduationCap className="w-4 h-4 mr-2" />
            Schedule Training
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-500" aria-busy="true">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          Loading…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
            <MetricCard
              label="Agreement Signed"
              value={agreementSigned}
              icon={CheckCircle}
              trend="Pending Start"
              trendUp={true}
            />
            <MetricCard
              label="In Onboarding"
              value={inOnboarding}
              icon={GraduationCap}
              trend="Active reps"
              trendUp={true}
            />
            <MetricCard
              label={trainingLabel}
              value={metricValue(trainingType, trainingCount, trainingPercentage)}
              icon={CheckCircle}
              trend="From settings"
              trendUp={true}
            />
            <MetricCard
              label={readyLabel}
              value={metricValue(readyType, readyCount, readyPercentage)}
              icon={User}
              trend="From settings"
              trendUp={true}
            />
          </div>

          {blockedReps.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-sm mb-8 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Action Required: {blockedReps.length} Rep{blockedReps.length !== 1 ? "s" : ""} Blocked
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {blockedReps[0].name} has been in onboarding for {blockedReps[0].daysInOnboarding} days.
                  {blockedReps.length > 1
                    ? ` +${blockedReps.length - 1} more over 14 days.`
                    : ""}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reps.map((rep) => (
              <OnboardingCard key={rep.id} rep={rep} personId={rep.id} />
            ))}
          </div>
          {reps.length === 0 && !loading && (
            <p className="text-center text-gray-500 py-12">No one in onboarding right now.</p>
          )}
        </>
      )}
    </>
  );
}
