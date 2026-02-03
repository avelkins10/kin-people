import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { headers } from "next/headers";
import Link from "next/link";
import {
  CheckCircle,
  GraduationCap,
  Users,
  Clock,
  MapPin,
  MoreHorizontal,
  ChevronRight,
  Check,
} from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { AlertBanner } from "@/components/shared/alert-banner";
import { Badge } from "@/components/ui/badge";

// Mock onboarding data - in real app this would come from the API
const onboardingReps = [
  {
    id: "1",
    name: "Stanley Hudson",
    initials: "SH",
    hireDate: "Oct 20, 2023",
    manager: "Michael Scott",
    team: "Team Alpha",
    office: "Phoenix HQ",
    tier: "ROOKIE",
    progress: 33,
    daysIn: 5,
    tasks: [
      { name: "Equipment Issued", completed: true },
      { name: "Product Training", completed: true },
      { name: "Sales Scripts", completed: false },
    ],
    remainingTasks: 3,
  },
  {
    id: "2",
    name: "Phyllis Vance",
    initials: "PV",
    hireDate: "Oct 12, 2023",
    manager: "Michael Scott",
    team: "Team Alpha",
    office: "Phoenix HQ",
    tier: "ROOKIE",
    progress: 83,
    daysIn: 13,
    tasks: [
      { name: "Equipment Issued", completed: true },
      { name: "Product Training", completed: true },
      { name: "Sales Scripts", completed: true },
    ],
    remainingTasks: 3,
    alert: true,
  },
  {
    id: "3",
    name: "Ryan Howard",
    initials: "RH",
    hireDate: "Oct 24, 2023",
    manager: "Michael Scott",
    team: "Team Alpha",
    office: "Phoenix HQ",
    tier: "ROOKIE",
    progress: 0,
    daysIn: 1,
    tasks: [
      { name: "Equipment Issued", completed: false },
      { name: "Product Training", completed: false },
      { name: "Sales Scripts", completed: false },
    ],
    remainingTasks: 3,
  },
];

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canViewAll = hasPermission(user, Permission.VIEW_ALL_PEOPLE);
  const canViewOffice = hasPermission(user, Permission.VIEW_OWN_OFFICE_PEOPLE);

  if (!canViewAll && !canViewOffice) {
    redirect("/dashboard");
  }

  // Find reps that need attention (>10 days in onboarding)
  const alertReps = onboardingReps.filter((r) => r.daysIn > 10);

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Onboarding Tracker
          </h1>
          <p className="text-gray-500 font-medium">
            Track new hire progress from agreement to first sale.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/people"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            <Users className="w-4 h-4" /> Assign Mentor
          </Link>
          <Link
            href="/onboarding/training"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-sm text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            <GraduationCap className="w-4 h-4" /> Schedule Training
          </Link>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Agreement Signed"
          value="3"
          icon={CheckCircle}
          trend="Pending Start"
          trendUp
        />
        <MetricCard
          label="In Onboarding"
          value="12"
          icon={GraduationCap}
          trend="Avg 14 days"
          trendUp
        />
        <MetricCard
          label="Training Complete"
          value="89%"
          icon={CheckCircle}
          trend="Completion Rate"
          trendUp
        />
        <MetricCard
          label="Ready for Field"
          value="4"
          icon={Users}
          trend="This Week"
          trendUp
        />
      </div>

      {/* Alert */}
      {alertReps.length > 0 && (
        <div className="mb-8">
          <AlertBanner
            title={`Action Required: ${alertReps.length} Reps Blocked`}
            description={`${alertReps[0].name} has been in onboarding for ${alertReps[0].daysIn} days. Missing "First Appointment".`}
            actionLabel="View Details"
            actionHref={`/people/${alertReps[0].id}`}
          />
        </div>
      )}

      {/* Onboarding Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {onboardingReps.map((rep) => (
          <div
            key={rep.id}
            className="bg-white border border-gray-100 rounded-sm p-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                  {rep.initials}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{rep.name}</div>
                  <div className="text-xs text-gray-500">
                    Hired {rep.hireDate}
                  </div>
                </div>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded-sm transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Details */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {rep.manager}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {rep.office}
              </div>
              <Badge className="bg-gray-100 text-gray-700 border-0 text-[10px] font-bold">
                {rep.tier}
              </Badge>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  Progress
                </span>
                <span
                  className={`text-sm font-bold ${rep.progress >= 80 ? "text-green-600" : rep.progress >= 50 ? "text-indigo-600" : "text-red-500"}`}
                >
                  {rep.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${rep.progress >= 80 ? "bg-green-500" : rep.progress >= 50 ? "bg-indigo-600" : "bg-indigo-600"}`}
                  style={{ width: `${rep.progress}%` }}
                />
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-2 mb-4">
              {rep.tasks.map((task, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center ${task.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                  >
                    {task.completed && <Check className="w-3 h-3" />}
                  </div>
                  <span
                    className={task.completed ? "text-gray-500 line-through" : "text-gray-700"}
                  >
                    {task.name}
                  </span>
                </div>
              ))}
              {rep.remainingTasks > 0 && (
                <div className="text-xs text-gray-400 pl-7">
                  + {rep.remainingTasks} more tasks
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {rep.daysIn} days
              </div>
              <Link
                href={`/people/${rep.id}`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                View Details <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
