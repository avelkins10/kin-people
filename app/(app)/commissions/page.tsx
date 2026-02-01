import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { CommissionsSummaryCards } from "@/components/commissions/commissions-summary-cards";
import { CommissionsTabs } from "@/components/commissions/commissions-tabs";
import { headers } from "next/headers";

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Get headers to forward cookies and construct base URL
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (host ? `${protocol}://${host}` : "http://localhost:3000");

  // Get tab from search params (default to "my-deals")
  const tab = (searchParams.tab as string) || "my-deals";

  // Build API params from search params
  const apiParams = new URLSearchParams();
  apiParams.set("tab", tab);
  if (searchParams.dateStart) {
    apiParams.set("dateStart", searchParams.dateStart as string);
  }
  if (searchParams.dateEnd) {
    apiParams.set("dateEnd", searchParams.dateEnd as string);
  }
  if (searchParams.status) {
    apiParams.set("status", searchParams.status as string);
  }
  if (searchParams.dealType) {
    apiParams.set("dealType", searchParams.dealType as string);
  }
  if (searchParams.commissionType) {
    apiParams.set("commissionType", searchParams.commissionType as string);
  }

  const apiUrl = `/api/commissions?${apiParams.toString()}`;

  // Fetch commissions data
  const response = await fetch(`${baseUrl}${apiUrl}`, {
    headers: {
      ...(cookieHeader && { cookie: cookieHeader }),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch commissions data");
  }

  const commissionsData = await response.json();

  // Calculate summary totals (this month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

  const thisMonthCommissions = commissionsData.filter((item: any) => {
    const closeDate = item.deal.closeDate;
    if (!closeDate) return false;
    return closeDate >= startOfMonthStr;
  });

  const pending = thisMonthCommissions
    .filter((item: any) => item.commission.status === "pending")
    .reduce((sum: number, item: any) => sum + parseFloat(item.commission.amount), 0);

  const approved = thisMonthCommissions
    .filter((item: any) => item.commission.status === "approved")
    .reduce((sum: number, item: any) => sum + parseFloat(item.commission.amount), 0);

  const paid = thisMonthCommissions
    .filter((item: any) => item.commission.status === "paid")
    .reduce((sum: number, item: any) => sum + parseFloat(item.commission.amount), 0);

  const canApprove = hasPermission(user, Permission.APPROVE_COMMISSIONS);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Commissions</h1>
        <p className="text-sm text-gray-600 mt-1">
          View and manage your commission earnings
        </p>
      </div>

      <CommissionsSummaryCards
        pending={pending}
        approved={approved}
        paid={paid}
      />

      <CommissionsTabs
        activeTab={tab}
        commissionsData={commissionsData}
        currentUserId={user.id}
        canApprove={canApprove}
      />
    </main>
  );
}
