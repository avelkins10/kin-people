"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import {
  DollarSign,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { CommissionsTabs } from "@/components/commissions/commissions-tabs";
import { Permission } from "@/lib/permissions/types";
import { useCommissions } from "@/hooks/use-commissions-data";
import { useCurrentUser } from "@/hooks/use-auth-data";
import { toast } from "@/hooks/use-toast";

function getMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function CommissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [exporting, setExporting] = useState(false);
  const [runningPayroll, setRunningPayroll] = useState(false);
  const [payrollStart, setPayrollStart] = useState("");
  const [payrollEnd, setPayrollEnd] = useState("");
  const [summary, setSummary] = useState<{
    totalCommissions: number;
    totalPeople: number;
    pendingAmount: number;
  } | null>(null);

  const tab = searchParams.get("tab") || "my-deals";
  const status = searchParams.get("status") ?? "";
  const dealType = searchParams.get("dealType") ?? "";
  const commissionType = searchParams.get("commissionType") ?? "";
  const dateStart = searchParams.get("dateStart") ?? "";
  const dateEnd = searchParams.get("dateEnd") ?? "";

  // Use React Query hooks - automatically cached and deduplicated
  const {
    data: commissionsData = [],
    isLoading: loading,
    error: queryError,
  } = useCommissions({
    status: status || undefined,
  });

  const { data: authData } = useCurrentUser();

  const currentUserId = authData?.user?.id ?? "";
  const permissions = authData?.permissions ?? [];
  const canApprove = permissions.includes(Permission.APPROVE_COMMISSIONS);
  const canRunPayroll = permissions.includes(Permission.RUN_PAYROLL);

  const error = queryError ? (queryError as Error).message : null;

  // Fetch payroll summary (only when user has permission)
  const fetchSummary = useCallback(async () => {
    if (!canRunPayroll) return;
    const { start, end } = getMonthRange();
    try {
      const res = await fetch(
        `/api/payroll/summary?startDate=${start}&endDate=${end}`
      );
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      setSummary(null);
    }
  }, [canRunPayroll]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const { start, end } = getMonthRange();
    if (!payrollStart) setPayrollStart(start);
    if (!payrollEnd) setPayrollEnd(end);
  }, []);

  const handleExportPayroll = async () => {
    const start = payrollStart || getMonthRange().start;
    const end = payrollEnd || getMonthRange().end;
    setExporting(true);
    try {
      const res = await fetch("/api/payroll/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: start, endDate: end }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-${start}-to-${end}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Export failed",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleRunPayroll = async () => {
    const start = payrollStart || getMonthRange().start;
    const end = payrollEnd || getMonthRange().end;
    setRunningPayroll(true);
    try {
      const periodRes = await fetch(
        `/api/payroll/period?startDate=${start}&endDate=${end}`
      );
      if (!periodRes.ok) throw new Error("Failed to load period");
      const periodList = await periodRes.json();
      const approvedIds = (periodList || [])
        .filter((r: any) => (r.status || "").toLowerCase() === "approved")
        .map((r: any) => r.id);
      if (approvedIds.length === 0) {
        toast({
          title: "No Approved Commissions",
          description: "No approved commissions in this period to mark as paid.",
          variant: "destructive",
        });
        setRunningPayroll(false);
        return;
      }
      const markRes = await fetch("/api/payroll/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionIds: approvedIds }),
      });
      if (!markRes.ok) {
        const data = await markRes.json().catch(() => ({}));
        throw new Error(data.error || "Mark paid failed");
      }
      await fetchSummary();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Run payroll failed",
        variant: "destructive",
      });
    } finally {
      setRunningPayroll(false);
    }
  };

  const pendingPayout = summary?.pendingAmount ?? 0;
  const nextPayrollLabel = (() => {
    const n = new Date();
    n.setMonth(n.getMonth() + 1);
    n.setDate(1);
    return n.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })();

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Commissions & Payroll
          </h1>
          <p className="text-gray-500 font-medium">
            Track earnings, approve payouts, and manage payroll.
          </p>
        </div>
        {canRunPayroll && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm"
                value={payrollStart}
                onChange={(e) => setPayrollStart(e.target.value)}
                aria-label="Payroll start date"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm"
                value={payrollEnd}
                onChange={(e) => setPayrollEnd(e.target.value)}
                aria-label="Payroll end date"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleExportPayroll}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export Payroll
            </Button>
            <Button onClick={handleRunPayroll} disabled={runningPayroll}>
              {runningPayroll ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4 mr-2" />
              )}
              Run Payroll
            </Button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <MetricCard
          label="Pending Payout"
          value={
            summary != null
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(pendingPayout)
              : "—"
          }
          icon={Clock}
          trend="Next cycle"
          trendUp={true}
        />
        <MetricCard
          label="Approved / Paid (period)"
          value={
            summary != null
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(Math.max(0, (summary?.totalCommissions ?? 0) - pendingPayout))
              : "—"
          }
          icon={CheckCircle}
          trend="Ready to pay"
          trendUp={true}
        />
        <MetricCard
          label="Total (period)"
          value={
            summary != null
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(summary?.totalCommissions ?? 0)
              : "—"
          }
          icon={DollarSign}
          trend={summary ? `${summary?.totalPeople ?? 0} people` : "—"}
          trendUp={true}
        />
        <MetricCard
          label="Next Payroll"
          value={nextPayrollLabel}
          icon={Calendar}
          trend="Next month"
          trendUp={true}
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500" aria-busy="true">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          Loading commissions…
        </div>
      ) : (
        <CommissionsTabs
          activeTab={tab}
          commissionsData={commissionsData}
          currentUserId={currentUserId}
          canApprove={canApprove}
        />
      )}
    </>
  );
}
