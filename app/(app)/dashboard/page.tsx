import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { headers } from "next/headers";
import Link from "next/link";
import {
  UserPlus,
  TrendingUp,
  GraduationCap,
  Clock,
  Users,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { AlertBanner } from "@/components/shared/alert-banner";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { QuickActions } from "@/components/shared/quick-actions";

const pipelineStages = [
  { name: "Lead", count: 12, color: "bg-gray-400" },
  { name: "Contacted", count: 8, color: "bg-blue-400" },
  { name: "Interviewing", count: 5, color: "bg-indigo-500" },
  { name: "Offer Sent", count: 3, color: "bg-purple-500" },
  { name: "Agreement", count: 2, color: "bg-pink-500" },
  { name: "Onboarding", count: 4, color: "bg-amber-500" },
];

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
    return null; // This ensures TypeScript knows we exit here
  }

  const user = currentUser; // Now user is definitely not null

  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (host ? `${protocol}://${host}` : "http://localhost:3000");

  const showRecruitingPipeline = hasPermission(user, Permission.CREATE_RECRUITS);

  // Fetch recruiting stats if user has permission
  let recruitStageCounts: Record<string, number> = {};
  let totalRecruits = 0;

  if (showRecruitingPipeline) {
    try {
      const recruitsResponse = await fetch(`${baseUrl}/api/recruits`, {
        headers: cookieHeader ? { cookie: cookieHeader } : {},
        cache: "no-store",
      });
      if (recruitsResponse.ok) {
        const recruits = await recruitsResponse.json();
        const counts: Record<string, number> = {};
        for (const r of recruits) {
          const status = r.recruit?.status ?? "lead";
          counts[status] = (counts[status] ?? 0) + 1;
        }
        recruitStageCounts = counts;
        totalRecruits = recruits.length;
      }
    } catch (error) {
      console.error("Error fetching recruits:", error);
    }
  }

  // Calculate pipeline data from actual counts or use defaults
  const actualPipelineStages = [
    { name: "Lead", count: recruitStageCounts["lead"] ?? 12, color: "bg-gray-400" },
    { name: "Contacted", count: recruitStageCounts["contacted"] ?? 8, color: "bg-blue-400" },
    { name: "Interviewing", count: recruitStageCounts["interviewing"] ?? 5, color: "bg-indigo-500" },
    { name: "Offer Sent", count: recruitStageCounts["offer_sent"] ?? 3, color: "bg-purple-500" },
    { name: "Agreement", count: recruitStageCounts["agreement"] ?? 2, color: "bg-pink-500" },
    { name: "Onboarding", count: recruitStageCounts["onboarding"] ?? 4, color: "bg-amber-500" },
  ];

  const maxCount = Math.max(...actualPipelineStages.map((s) => s.count), 1);
  const totalInPipeline = actualPipelineStages.reduce((sum, s) => sum + s.count, 0);

  const recentHires = [
    { name: "Stanley Hudson", daysIn: 5, progress: 33, office: "Phoenix HQ" },
    { name: "Phyllis Vance", daysIn: 13, progress: 83, office: "Phoenix HQ" },
    { name: "Ryan Howard", daysIn: 1, progress: 0, office: "Phoenix HQ" },
  ];

  const quickActions = [
    { icon: UserPlus, label: "Add New Recruit", color: "text-indigo-400", href: "/recruiting" },
    { icon: CheckCircle, label: "Convert to Person", color: "text-green-400", href: "/recruiting" },
    { icon: GraduationCap, label: "Schedule Training", color: "text-amber-400", href: "/onboarding" },
    { icon: Users, label: "Assign Mentor", color: "text-blue-400", href: "/people" },
  ];

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Recruiting & Onboarding
          </h1>
          <p className="text-gray-500 font-medium">
            Build your sales team from lead to field-ready rep.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/recruiting"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add Recruit
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-sm text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            <GraduationCap className="w-4 h-4" /> View Onboarding
          </Link>
        </div>
      </header>

      {/* Alert */}
      <div className="mb-8">
        <AlertBanner
          title="3 Items Need Attention"
          description="2 recruits stuck in pipeline >5 days • 1 onboarding rep blocked"
          actionLabel="View All"
          actionHref="/recruiting"
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Active Recruits"
          value={totalRecruits || 28}
          icon={UserPlus}
          trend="+5 this week"
          trendUp
        />
        <MetricCard
          label="Conversion Rate"
          value="34%"
          icon={TrendingUp}
          trend="Lead → Hired"
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
          label="Avg Time to Hire"
          value="18 days"
          icon={Clock}
          trend="-3 days vs last month"
          trendUp
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pipeline */}
          <div className="bg-white p-6 border border-gray-100 rounded-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold tracking-tight text-black uppercase">
                Recruiting Pipeline
              </h3>
              <Link
                href="/recruiting"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide flex items-center"
              >
                View Full Pipeline <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {actualPipelineStages.map((stage) => (
                <div key={stage.name} className="flex items-center gap-4">
                  <div className="w-24 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {stage.name}
                  </div>
                  <div className="flex-1 h-8 bg-gray-50 rounded-sm overflow-hidden relative">
                    <div
                      className={`h-full ${stage.color} transition-all duration-500`}
                      style={{ width: `${(stage.count / maxCount) * 100}%` }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-700">
                      {stage.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-6">
              <div>
                <span className="text-2xl font-extrabold text-black">
                  {totalInPipeline}
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase ml-2">
                  Total in Pipeline
                </span>
              </div>
              <div className="h-8 w-px bg-gray-100" />
              <span className="text-xs font-bold text-green-600">+12%</span>
            </div>
          </div>

          {/* Onboarding */}
          <div className="bg-white p-6 border border-gray-100 rounded-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold tracking-tight text-black uppercase">
                Onboarding Progress
              </h3>
              <Link
                href="/onboarding"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide flex items-center"
              >
                View All <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentHires.map((hire) => (
                <div
                  key={hire.name}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-sm hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                    {hire.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900">
                        {hire.name}
                      </span>
                      <span className="text-xs font-bold text-indigo-600">
                        {hire.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${hire.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-500">
                        {hire.office}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${hire.daysIn > 10 ? "text-red-500" : "text-gray-400"}`}
                      >
                        Day {hire.daysIn}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-xl font-extrabold text-black">3</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Starting Soon
                </span>
              </div>
              <div>
                <span className="text-xl font-extrabold text-black">12</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  In Training
                </span>
              </div>
              <div>
                <span className="text-xl font-extrabold text-green-600">4</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Field Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <ActivityFeed />
          <QuickActions actions={quickActions} />
        </div>
      </div>
    </>
  );
}
