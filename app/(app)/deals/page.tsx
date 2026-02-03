import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { CreateDealModal } from "@/components/deals/modals/create-deal-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Plus,
  Download,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Filter,
  X,
  MoreHorizontal,
  SunMedium,
  Zap,
  Battery,
} from "lucide-react";
import { headers } from "next/headers";
import { MetricCard } from "@/components/shared/metric-card";

export default async function DealsPage({
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
  const canCreate = hasPermission(user, Permission.CREATE_DEALS);

  if (!canViewAll && !canViewOffice) {
    redirect("/dashboard");
  }

  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (host ? `${protocol}://${host}` : "http://localhost:3000");

  const apiParams = new URLSearchParams();
  if (searchParams.officeId) {
    apiParams.set("officeId", searchParams.officeId as string);
  }
  if (searchParams.status) {
    apiParams.set("status", searchParams.status as string);
  }
  if (searchParams.dealType) {
    apiParams.set("dealType", searchParams.dealType as string);
  }
  if (searchParams.startDate) {
    apiParams.set("startDate", searchParams.startDate as string);
  }
  if (searchParams.endDate) {
    apiParams.set("endDate", searchParams.endDate as string);
  }
  if (searchParams.setterId) {
    apiParams.set("setterId", searchParams.setterId as string);
  }
  if (searchParams.closerId) {
    apiParams.set("closerId", searchParams.closerId as string);
  }

  const apiUrl = `/api/deals?${apiParams.toString()}`;

  const response = await fetch(`${baseUrl}${apiUrl}`, {
    headers: {
      ...(cookieHeader && { cookie: cookieHeader }),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch deals data");
  }

  const dealsData = await response.json();

  // Calculate stats
  const totalRevenue = dealsData.reduce(
    (sum: number, d: { deal_value?: string | number }) =>
      sum + (parseFloat(String(d.deal_value)) || 0),
    0
  );
  const dealsSold = dealsData.length;
  const installPending = dealsData.filter(
    (d: { status?: string }) =>
      d.status === "install_pending" || d.status === "pending"
  ).length;
  const ptoComplete = dealsData.filter(
    (d: { status?: string }) => d.status === "pto_complete" || d.status === "complete"
  ).length;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getStatusStyle = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "pto_complete":
      case "complete":
        return { bg: "bg-green-100", text: "text-green-700" };
      case "install_pending":
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-700" };
      case "cancelled":
        return { bg: "bg-red-100", text: "text-red-700" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-600" };
    }
  };

  const getDealTypeIcon = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case "solar":
        return SunMedium;
      case "battery":
        return Battery;
      case "solar + battery":
        return Zap;
      default:
        return SunMedium;
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Deals Tracker
          </h1>
          <p className="text-gray-500 font-medium">
            Track sales from contract to PTO completion.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm text-sm font-bold hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          {canCreate && (
            <CreateDealModal>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-sm font-bold">
                <Plus className="h-4 w-4 mr-2" />
                New Deal
              </Button>
            </CreateDealModal>
          )}
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          trend="+12% vs last month"
          trendUp
        />
        <MetricCard
          label="Deals Sold"
          value={dealsSold}
          icon={TrendingUp}
          trend="+8 this week"
          trendUp
        />
        <MetricCard
          label="Install Pending"
          value={installPending}
          icon={Clock}
          trend="Avg 14 days"
          trendUp
        />
        <MetricCard
          label="PTO Complete"
          value={ptoComplete}
          icon={CheckCircle}
          trend="This month"
          trendUp
        />
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          FILTERS
        </span>
        <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
          <option>OFFICE: ALL</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
          <option>TYPE: ALL</option>
          <option>Solar</option>
          <option>Battery</option>
          <option>Solar + Battery</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
          <option>STATUS: ALL</option>
          <option>PTO Complete</option>
          <option>Install Pending</option>
          <option>Cancelled</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
          <option>SETTER: ALL</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white">
          <option>CLOSER: ALL</option>
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
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Value
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                System Size
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Setter
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Closer
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                Sale Date
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {dealsData.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No deals found
                </td>
              </tr>
            ) : (
              dealsData.map(
                (deal: {
                  id: string;
                  customer_name?: string;
                  deal_type?: string;
                  deal_value?: string | number;
                  system_size_kw?: string | number;
                  setter_name?: string;
                  closer_name?: string;
                  status?: string;
                  sale_date?: string;
                }) => {
                  const statusStyle = getStatusStyle(deal.status);
                  const DealIcon = getDealTypeIcon(deal.deal_type);

                  return (
                    <tr
                      key={deal.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/deals/${deal.id}`}
                          className="font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {deal.customer_name || "Unknown Customer"}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <DealIcon className="w-4 h-4 text-amber-600" />
                          </div>
                          <span className="text-sm text-gray-700">
                            {deal.deal_type || "Solar"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">
                          ${parseFloat(String(deal.deal_value) || "0").toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {deal.system_size_kw || "-"} kW
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                            {deal.setter_name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || "?"}
                          </div>
                          <span className="text-sm text-gray-600">
                            {deal.setter_name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {deal.closer_name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || "?"}
                          </div>
                          <span className="text-sm text-gray-600">
                            {deal.closer_name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={`${statusStyle.bg} ${statusStyle.text} border-0 text-[10px] font-bold uppercase`}
                        >
                          {deal.status?.replace(/_/g, " ") || "Pending"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {deal.sale_date
                          ? new Date(deal.sale_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
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
