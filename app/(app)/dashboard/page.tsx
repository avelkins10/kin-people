import { getCurrentUser } from "@/lib/auth/get-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import {
  RecentDealsWidget,
  type RecentDealItem,
} from "@/components/dashboard/recent-deals-widget";
import { RecruitingPipelineWidget } from "@/components/dashboard/recruiting-pipeline-widget";
import { TeamPerformanceWidget } from "@/components/dashboard/team-performance-widget";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  const currentUser = user as NonNullable<typeof user>;

  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (host ? `${protocol}://${host}` : "http://localhost:3000");

  let pendingTotal = 0;
  let approvedTotal = 0;
  let recentDeals: RecentDealItem[] = [];
  let allDealsCount = 0;
  let teamPendingTotal = 0;
  let teamApprovedTotal = 0;
  let recruitStageCounts: Record<string, number> = {};

  const showTeamPerformance =
    hasPermission(currentUser, Permission.MANAGE_OWN_TEAM) ||
    hasPermission(currentUser, Permission.MANAGE_OWN_OFFICE) ||
    hasPermission(currentUser, Permission.MANAGE_OWN_REGION) ||
    hasPermission(currentUser, Permission.VIEW_ALL_PEOPLE);
  const showRecruitingPipeline = hasPermission(
    currentUser,
    Permission.CREATE_RECRUITS
  );

  try {
    const fetchPromises: Promise<Response | null>[] = [
      fetch(`${baseUrl}/api/commissions?status=pending&tab=my-deals`, {
        headers: cookieHeader ? { cookie: cookieHeader } : {},
        cache: "no-store",
      }),
      fetch(`${baseUrl}/api/commissions?status=approved&tab=my-deals`, {
        headers: cookieHeader ? { cookie: cookieHeader } : {},
        cache: "no-store",
      }),
      fetch(`${baseUrl}/api/deals?limit=5`, {
        headers: cookieHeader ? { cookie: cookieHeader } : {},
        cache: "no-store",
      }),
    ];
    if (showTeamPerformance) {
      fetchPromises.push(
        fetch(`${baseUrl}/api/deals`, {
          headers: cookieHeader ? { cookie: cookieHeader } : {},
          cache: "no-store",
        }),
        fetch(`${baseUrl}/api/commissions?status=pending&tab=team`, {
          headers: cookieHeader ? { cookie: cookieHeader } : {},
          cache: "no-store",
        }),
        fetch(`${baseUrl}/api/commissions?status=approved&tab=team`, {
          headers: cookieHeader ? { cookie: cookieHeader } : {},
          cache: "no-store",
        })
      );
    }
    if (showRecruitingPipeline) {
      fetchPromises.push(
        fetch(`${baseUrl}/api/recruits`, {
          headers: cookieHeader ? { cookie: cookieHeader } : {},
          cache: "no-store",
        })
      );
    }
    const responses = await Promise.all(fetchPromises);
    let idx = 0;
    const pendingResponse = responses[idx++] as Response;
    const approvedResponse = responses[idx++] as Response;
    const recentDealsResponse = responses[idx++] as Response;
    const allDealsResponse = showTeamPerformance ? (responses[idx++] as Response) : null;
    const teamPendingResponse = showTeamPerformance ? (responses[idx++] as Response) : null;
    const teamApprovedResponse = showTeamPerformance ? (responses[idx++] as Response) : null;
    const recruitsResponse = showRecruitingPipeline ? (responses[idx++] as Response) : null;

    if (pendingResponse.ok) {
      const pendingData = await pendingResponse.json();
      pendingTotal = pendingData.reduce(
        (sum: number, item: { commission: { amount: string } }) =>
          sum + parseFloat(item.commission.amount),
        0
      );
    }
    if (approvedResponse.ok) {
      const approvedData = await approvedResponse.json();
      approvedTotal = approvedData.reduce(
        (sum: number, item: { commission: { amount: string } }) =>
          sum + parseFloat(item.commission.amount),
        0
      );
    }
    if (recentDealsResponse.ok) {
      const data = await recentDealsResponse.json();
      recentDeals = data.slice(0, 5);
    }
    if (allDealsResponse?.ok) {
      const data = await allDealsResponse.json();
      allDealsCount = Array.isArray(data) ? data.length : 0;
    }
    if (teamPendingResponse?.ok) {
      const data = await teamPendingResponse.json();
      teamPendingTotal = Array.isArray(data)
        ? data.reduce(
            (sum: number, item: { commission: { amount: string } }) =>
              sum + parseFloat(item.commission?.amount ?? "0"),
            0
          )
        : 0;
    }
    if (teamApprovedResponse?.ok) {
      const data = await teamApprovedResponse.json();
      teamApprovedTotal = Array.isArray(data)
        ? data.reduce(
            (sum: number, item: { commission: { amount: string } }) =>
              sum + parseFloat(item.commission?.amount ?? "0"),
            0
          )
        : 0;
    }
    if (recruitsResponse?.ok) {
      const recruits = await recruitsResponse.json();
      const counts: Record<string, number> = {};
      for (const r of recruits) {
        const status = r.recruit?.status ?? "lead";
        counts[status] = (counts[status] ?? 0) + 1;
      }
      recruitStageCounts = counts;
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }

  const totalCommissionValue = showTeamPerformance
    ? teamPendingTotal + teamApprovedTotal
    : pendingTotal + approvedTotal;
  const teamPerformanceLabel = hasPermission(currentUser, Permission.MANAGE_OWN_TEAM)
    ? "Team Performance"
    : hasPermission(currentUser, Permission.MANAGE_OWN_OFFICE) ||
        hasPermission(currentUser, Permission.VIEW_ALL_PEOPLE)
      ? "Office Performance"
      : "My Performance";

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="mt-2 text-gray-600">
            Welcome, {currentUser.firstName} {currentUser.lastName}!
          </p>
          <p className="mt-1 text-sm text-gray-500">Role: {currentUser.roleName}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Commission Summary - 2/3 width, full width when Team Performance hidden */}
          <div className={showTeamPerformance ? "md:col-span-2" : "md:col-span-3"}>
            <Card>
              <CardHeader>
                <CardTitle>Commission Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(pendingTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(approvedTotal)}
                    </p>
                  </div>
                </div>
                <Link href="/commissions">
                  <Button variant="outline" className="w-full">
                    View All Commissions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Team Performance - 1/3 width */}
          {showTeamPerformance && (
            <div className="md:col-span-1">
              <TeamPerformanceWidget
                metrics={{
                  totalDeals: allDealsCount,
                  totalCommissionValue,
                  label: teamPerformanceLabel,
                }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Recent Deals - 2/3 width, full width when Recruiting Pipeline hidden */}
          <div className={showRecruitingPipeline ? "md:col-span-2" : "md:col-span-3"}>
            <RecentDealsWidget deals={recentDeals} />
          </div>

          {/* Recruiting Pipeline - 1/3 width */}
          {showRecruitingPipeline && (
            <div className="md:col-span-1">
              <RecruitingPipelineWidget stageCounts={recruitStageCounts} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
