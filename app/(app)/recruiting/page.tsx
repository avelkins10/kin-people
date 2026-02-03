import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { RecruitingKanban } from "@/components/recruiting/recruiting-kanban";
import { RecruitingTable } from "@/components/recruiting/recruiting-table";
import { AddRecruitModal } from "@/components/recruiting/modals/add-recruit-modal";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, TrendingUp, Clock, FileText, LayoutGrid, List, X } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { MetricCard } from "@/components/shared/metric-card";
import { AlertBanner } from "@/components/shared/alert-banner";

export default async function RecruitingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canViewAll = hasPermission(user, Permission.VIEW_ALL_PEOPLE);
  const canViewOffice = hasPermission(user, Permission.VIEW_OWN_OFFICE_PEOPLE);
  const canCreate = hasPermission(user, Permission.CREATE_RECRUITS);

  if (!canViewAll && !canViewOffice) {
    redirect("/dashboard");
  }

  const view = (searchParams.view as string) || "kanban";

  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (host ? `${protocol}://${host}` : "http://localhost:3000");

  const apiParams = new URLSearchParams();
  if (searchParams.status) {
    apiParams.set("status", searchParams.status as string);
  }
  if (searchParams.recruiterId) {
    apiParams.set("recruiterId", searchParams.recruiterId as string);
  }
  if (searchParams.officeId) {
    apiParams.set("officeId", searchParams.officeId as string);
  }

  const apiUrl = `/api/recruits?${apiParams.toString()}`;

  const response = await fetch(`${baseUrl}${apiUrl}`, {
    headers: {
      ...(cookieHeader && { cookie: cookieHeader }),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch recruits data");
  }

  const recruitsData = await response.json();

  // Calculate stats
  const totalRecruits = recruitsData.length;
  const agreementsSent = recruitsData.filter(
    (r: { recruit: { status: string } }) =>
      r.recruit.status === "agreement_sent" || r.recruit.status === "agreement_signed"
  ).length;

  // Find stuck recruits (in same status > 5 days)
  const stuckRecruits = recruitsData.filter((r: { recruit: { updatedAt: string } }) => {
    if (!r.recruit.updatedAt) return false;
    const daysInStatus = Math.floor(
      (new Date().getTime() - new Date(r.recruit.updatedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysInStatus > 5;
  });

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Recruiting Pipeline
          </h1>
          <p className="text-gray-500 font-medium">
            Manage your sales team growth from lead to certified rep.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/recruiting?convert=true"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Convert to Person
          </Link>
          <Link
            href="/recruiting?agreement=true"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" /> Send Agreement
          </Link>
          {canCreate && (
            <AddRecruitModal>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-sm font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Add Recruit
              </Button>
            </AddRecruitModal>
          )}
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Active Recruits"
          value={totalRecruits}
          icon={UserPlus}
          trend="12 Lead, 8 Interview, 5 Agreement, 3 Onboard"
          trendUp
        />
        <MetricCard
          label="Conversion Rate"
          value="34%"
          icon={TrendingUp}
          trend="Lead → Converted"
          trendUp
        />
        <MetricCard
          label="Avg Time to Hire"
          value="18 days"
          icon={Clock}
          trend="-3 days vs last month"
          trendUp
        />
        <MetricCard
          label="Agreements Pending"
          value={agreementsSent}
          icon={FileText}
          trend="Awaiting signature"
          trendUp
        />
      </div>

      {/* Alert */}
      {stuckRecruits.length > 0 && (
        <div className="mb-8">
          <AlertBanner
            title={`${stuckRecruits.length} Candidates require attention`}
            description={`${stuckRecruits.length} candidates stuck in "Phone Screen" for >5 days, 1 offer expiring soon.`}
            actionLabel="View Action Items"
            actionHref="/recruiting?filter=stuck"
          />
        </div>
      )}

      {/* Filters Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            FILTERS
          </span>
          <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
            <option>RECRUITER: ALL</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
            <option>OFFICE: ALL</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
            <option>PRIORITY: ALL</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
            <option>SOURCE: ALL</option>
          </select>
          <button className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <X className="w-3 h-3" /> CLEAR FILTERS
          </button>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-sm">
          <Link
            href="?view=kanban"
            className={`px-3 py-1.5 rounded-sm text-sm font-bold flex items-center gap-2 transition-colors ${
              view === "kanban"
                ? "bg-black text-white"
                : "text-gray-600 hover:text-black"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> KANBAN
          </Link>
          <Link
            href="?view=table"
            className={`px-3 py-1.5 rounded-sm text-sm font-bold flex items-center gap-2 transition-colors ${
              view === "table"
                ? "bg-black text-white"
                : "text-gray-600 hover:text-black"
            }`}
          >
            <List className="w-4 h-4" /> LIST
          </Link>
        </div>
      </div>

      {view === "kanban" ? (
        <RecruitingKanban initialRecruits={recruitsData} />
      ) : (
        <RecruitingTable initialRecruits={recruitsData} />
      )}
    </>
  );
}
