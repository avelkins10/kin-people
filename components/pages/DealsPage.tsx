"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import {
  DollarSign,
  CheckCircle,
  Clock,
  Zap,
  Plus,
  Filter,
  MoreHorizontal,
  Sun,
  Wind,
  Home,
  Loader2,
} from "lucide-react";
import { useModals } from "@/components/ModalsContext";
import { format } from "date-fns";

interface DealRow {
  id: string;
  customerName: string | null;
  dealType: string;
  systemSizeKw: string | null;
  dealValue: string;
  status: string;
  setterName: string;
  closerName: string;
  setterId: string | null;
  closerId: string | null;
  closeDate: string | null;
  saleDate: string | null;
}

function getStatusStyles(status: string): string {
  const s = (status || "").toLowerCase();
  if (s === "pto") return "bg-green-100 text-green-700 border-green-200";
  if (s === "installed") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "scheduled") return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "permitted") return "bg-indigo-100 text-indigo-700 border-indigo-200";
  if (s === "sold") return "bg-amber-100 text-amber-700 border-amber-200";
  if (s === "pending") return "bg-gray-100 text-gray-700 border-gray-200";
  if (s === "cancelled") return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-700";
}

function getStatusDisplay(status: string): string {
  if (!status) return "—";
  const s = status.toLowerCase();
  if (s === "pto") return "PTO";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getTypeIcon(type: string) {
  const t = (type || "").toLowerCase();
  if (t === "solar") return <Sun className="w-4 h-4 text-amber-500 shrink-0" />;
  if (t === "hvac") return <Wind className="w-4 h-4 text-blue-500 shrink-0" />;
  if (t === "roofing") return <Home className="w-4 h-4 text-red-500 shrink-0" />;
  return null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: string): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function DealsPage() {
  const { openNewDeal } = useModals();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [offices, setOffices] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const officeId = searchParams.get("officeId") ?? "";
  const status = searchParams.get("status") ?? "";
  const dealType = searchParams.get("dealType") ?? "";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/deals?${params.toString()}`);
    },
    [router, searchParams]
  );

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (officeId) params.set("officeId", officeId);
      if (status) params.set("status", status);
      if (dealType) params.set("dealType", dealType);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await fetch(`/api/deals?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load deals (${res.status})`);
      }
      const data = await res.json();
      setDeals(
        data.map((row: any) => {
          const d = row.deal || row;
          const setter = row.setter;
          const closer = row.closer;
          return {
            id: d.id,
            customerName: d.customerName ?? null,
            dealType: d.dealType ?? "",
            systemSizeKw: d.systemSizeKw ?? null,
            dealValue: d.dealValue ?? "0",
            status: d.status ?? "",
            setterName: setter
              ? `${setter.firstName ?? ""} ${setter.lastName ?? ""}`.trim()
              : "—",
            closerName: closer
              ? `${closer.firstName ?? ""} ${closer.lastName ?? ""}`.trim()
              : "—",
            setterId: setter?.id ?? null,
            closerId: closer?.id ?? null,
            closeDate: d.closeDate ?? null,
            saleDate: d.saleDate ?? null,
          };
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deals");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [officeId, status, dealType, startDate, endDate]);

  const fetchOffices = useCallback(async () => {
    try {
      const res = await fetch("/api/offices?active=true&scoped=true");
      if (res.ok) {
        const data = await res.json();
        setOffices(data.map((o: any) => ({ id: o.id, name: o.name })));
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  const totalValue = deals.reduce((sum, d) => sum + (parseFloat(d.dealValue) || 0), 0);
  const soldCount = deals.filter((d) => (d.status || "").toLowerCase() === "sold").length;
  const ptoCount = deals.filter((d) => (d.status || "").toLowerCase() === "pto").length;
  const installedCount = deals.filter((d) => (d.status || "").toLowerCase() === "installed").length;

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Deals Tracker
          </h1>
          <p className="text-gray-500 font-medium">
            Monitor sales performance from contract to install.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={openNewDeal}>
            <Plus className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <MetricCard
          label="Total Revenue"
          value={loading ? "—" : formatCurrency(String(totalValue))}
          icon={DollarSign}
          trend={deals.length ? `${deals.length} deals` : "No data"}
          trendUp={true}
        />
        <MetricCard
          label="Deals Sold"
          value={loading ? "—" : soldCount}
          icon={Zap}
          trend="Sold"
          trendUp={true}
        />
        <MetricCard
          label="Install Pending"
          value={loading ? "—" : installedCount}
          icon={Clock}
          trend="Installed"
          trendUp={true}
        />
        <MetricCard
          label="PTO Complete"
          value={loading ? "—" : ptoCount}
          icon={CheckCircle}
          trend="PTO"
          trendUp={true}
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white border border-gray-100 rounded-sm">
        <div className="flex items-center gap-2 text-gray-500 mr-2">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Filters</span>
        </div>
        <select
          className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide"
          value={status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="">Status: All</option>
          <option value="sold">Sold</option>
          <option value="pending">Pending</option>
          <option value="permitted">Permitted</option>
          <option value="scheduled">Scheduled</option>
          <option value="installed">Installed</option>
          <option value="pto">PTO</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide"
          value={dealType}
          onChange={(e) => updateFilter("dealType", e.target.value)}
        >
          <option value="">Type: All</option>
          <option value="solar">Solar</option>
          <option value="hvac">HVAC</option>
          <option value="roofing">Roofing</option>
        </select>
        <select
          className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide"
          value={officeId}
          onChange={(e) => updateFilter("officeId", e.target.value)}
        >
          <option value="">Office: All</option>
          {offices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide"
          value={startDate}
          onChange={(e) => updateFilter("startDate", e.target.value)}
          placeholder="Start"
        />
        <input
          type="date"
          className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide"
          value={endDate}
          onChange={(e) => updateFilter("endDate", e.target.value)}
          placeholder="End"
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500" aria-busy="true">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              Loading deals…
            </div>
          ) : deals.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              No deals match your filters. Try adjusting filters or create a new deal.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    System Size
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Setter / Closer
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-black">
                        {deal.customerName ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(deal.dealType)}
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {deal.dealType || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-black">
                        {formatCurrency(deal.dealValue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {deal.systemSizeKw ? `${deal.systemSizeKw} kW` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">
                          S:{" "}
                          {deal.setterId ? (
                            <Link
                              href={`/people/${deal.setterId}`}
                              className="text-indigo-600 hover:underline"
                            >
                              {deal.setterName}
                            </Link>
                          ) : (
                            deal.setterName
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          C:{" "}
                          {deal.closerId ? (
                            <Link
                              href={`/people/${deal.closerId}`}
                              className="text-indigo-600 hover:underline"
                            >
                              {deal.closerName}
                            </Link>
                          ) : (
                            deal.closerName
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-sm uppercase tracking-wide border ${getStatusStyles(deal.status)}`}
                      >
                        {getStatusDisplay(deal.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(deal.closeDate || deal.saleDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {deal.closerId ? (
                        <Link
                          href={`/people/${deal.closerId}`}
                          className="text-gray-400 hover:text-black transition-colors inline-flex"
                          aria-label={`View closer ${deal.closerName}`}
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </Link>
                      ) : (
                        <span className="text-gray-300">
                          <MoreHorizontal className="w-5 h-5" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
