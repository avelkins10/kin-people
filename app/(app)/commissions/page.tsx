import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { headers } from "next/headers";
import {
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Filter,
  X,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (host ? `${protocol}://${host}` : "http://localhost:3000");

  const tab = (searchParams.tab as string) || "all";

  const apiParams = new URLSearchParams();
  apiParams.set("tab", tab === "all" ? "team" : tab);
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

  // Calculate summary totals
  const totalEarned = commissionsData.reduce(
    (sum: number, item: { commission: { amount: string } }) =>
      sum + parseFloat(item.commission.amount || "0"),
    0
  );
  const pending = commissionsData
    .filter((item: { commission: { status: string } }) => item.commission.status === "pending")
    .reduce(
      (sum: number, item: { commission: { amount: string } }) =>
        sum + parseFloat(item.commission.amount || "0"),
      0
    );
  const approved = commissionsData
    .filter((item: { commission: { status: string } }) => item.commission.status === "approved")
    .reduce(
      (sum: number, item: { commission: { amount: string } }) =>
        sum + parseFloat(item.commission.amount || "0"),
      0
    );
  const paid = commissionsData
    .filter((item: { commission: { status: string } }) => item.commission.status === "paid")
    .reduce(
      (sum: number, item: { commission: { amount: string } }) =>
        sum + parseFloat(item.commission.amount || "0"),
      0
    );

  const canApprove = hasPermission(user, Permission.APPROVE_COMMISSIONS);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return { bg: "bg-green-100", text: "text-green-700" };
      case "approved":
        return { bg: "bg-blue-100", text: "text-blue-700" };
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-700" };
      case "rejected":
        return { bg: "bg-red-100", text: "text-red-700" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-600" };
    }
  };

  const tabs = [
    { id: "all", label: "All Commissions" },
    { id: "my-deals", label: "My Earnings" },
    { id: "team", label: "Team Overrides" },
  ];

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Commissions & Payroll
          </h1>
          <p className="text-gray-500 font-medium">
            Track earnings, approvals, and payment status.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm text-sm font-bold hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          {canApprove && (
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-sm text-sm font-bold hover:bg-gray-800 transition-colors">
              <CheckCircle className="w-4 h-4" /> Approve Selected
            </button>
          )}
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Earned"
          value={formatCurrency(totalEarned)}
          icon={DollarSign}
          trend="+15% vs last month"
          trendUp
        />
        <MetricCard
          label="Pending"
          value={formatCurrency(pending)}
          icon={Clock}
          trend="Awaiting approval"
          trendUp
        />
        <MetricCard
          label="Approved"
          value={formatCurrency(approved)}
          icon={CheckCircle}
          trend="Ready to pay"
          trendUp
        />
        <MetricCard
          label="Paid"
          value={formatCurrency(paid)}
          icon={TrendingUp}
          trend="This period"
          trendUp
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-sm w-fit mb-6">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={`px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
              tab === t.id
                ? "bg-black text-white"
                : "text-gray-600 hover:text-black"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          FILTERS
        </span>
        <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
          <option>STATUS: ALL</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
          <option>TYPE: ALL</option>
          <option>Setter</option>
          <option>Closer</option>
          <option>Override</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
          <option>DEAL TYPE: ALL</option>
          <option>Solar</option>
          <option>Battery</option>
          <option>Solar + Battery</option>
        </select>
        <input
          type="date"
          className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white"
        />
        <input
          type="date"
          className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white"
        />
        <button className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <X className="w-3 h-3" /> CLEAR
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {canApprove && (
                <th className="px-6 py-4 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Deal / Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Rep
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Close Date
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {commissionsData.length === 0 ? (
              <tr>
                <td
                  colSpan={canApprove ? 8 : 7}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No commissions found
                </td>
              </tr>
            ) : (
              commissionsData.map(
                (item: {
                  commission: {
                    id: string;
                    amount: string;
                    status: string;
                    commissionType: string;
                  };
                  deal: {
                    id: string;
                    customerName: string;
                    closeDate: string;
                    dealType: string;
                  };
                  rep: {
                    id: string;
                    firstName: string;
                    lastName: string;
                  };
                }) => {
                  const statusStyle = getStatusStyle(item.commission.status);
                  const initials = `${item.rep.firstName?.[0] || ""}${item.rep.lastName?.[0] || ""}`.toUpperCase();

                  return (
                    <tr
                      key={item.commission.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      {canApprove && (
                        <td className="px-6 py-4">
                          <input type="checkbox" className="rounded" />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <Link
                          href={`/deals/${item.deal.id}`}
                          className="font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {item.deal.customerName || "Unknown"}
                        </Link>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {item.deal.dealType || "Solar"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                            {initials}
                          </div>
                          <span className="text-sm text-gray-700">
                            {item.rep.firstName} {item.rep.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 capitalize">
                          {item.commission.commissionType?.replace(/_/g, " ") ||
                            "Setter"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-gray-900">
                          ${parseFloat(item.commission.amount || "0").toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={`${statusStyle.bg} ${statusStyle.text} border-0 text-[10px] font-bold uppercase`}
                        >
                          {item.commission.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.deal.closeDate
                          ? new Date(item.deal.closeDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-gray-100 rounded-sm transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
