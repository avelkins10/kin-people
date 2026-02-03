"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCommissions } from "@/hooks/use-commissions-data";

interface PersonCommissionsProps {
  personId: string;
}

interface Commission {
  id: string;
  dealId: string;
  commissionType: string;
  amount: string;
  status: string;
  calcDetails: any;
  createdAt: string;
  deal?: {
    id: string;
    customerName: string | null;
    closeDate: string | null;
    dealType: string;
  };
}

export function PersonCommissions({ personId }: PersonCommissionsProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch commissions for this person - React Query caches this
  const { data: commissionsData = [], isLoading: loading } = useCommissions({
    personId,
  });

  // Transform the data to match the expected shape and sort by date
  const commissions = commissionsData
    .map((c: any) => ({
      id: c.commission.id,
      dealId: c.commission.dealId,
      commissionType: c.commission.commissionType,
      amount: c.commission.amount,
      status: c.commission.status,
      calcDetails: c.commission.calcDetails || null,
      createdAt: c.commission.createdAt,
      deal: c.deal ? {
        id: c.deal.id,
        customerName: c.deal.customerName || null,
        closeDate: null,
        dealType: null,
      } : undefined,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function formatCurrency(value: string): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(value));
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  }

  function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "approved":
        return "default";
      case "paid":
        return "secondary";
      case "void":
        return "destructive";
      default:
        return "outline";
    }
  }

  function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      setter: "Setter",
      closer: "Closer",
      self_gen: "Self Gen",
      override_reports_to_l1: "Override L1",
      override_reports_to_l2: "Override L2",
      override_recruited_by_l1: "Recruiting L1",
      override_recruited_by_l2: "Recruiting L2",
    };
    return labels[type] || type;
  }

  function toggleRow(commissionId: string) {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(commissionId)) {
      newExpanded.delete(commissionId);
    } else {
      newExpanded.add(commissionId);
    }
    setExpandedRows(newExpanded);
  }

  // Calculate totals
  const totals = commissions.reduce(
    (acc, comm) => {
      const amount = parseFloat(comm.amount);
      if (comm.status === "pending") acc.pending += amount;
      if (comm.status === "approved") acc.approved += amount;
      if (comm.status === "paid") acc.paid += amount;
      return acc;
    },
    { pending: 0, approved: 0, paid: 0 }
  );

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading commissions...</div>;
  }

  if (commissions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No commissions found for this person.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold mb-3">Commission Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.pending.toString())}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.approved.toString())}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.paid.toString())}</p>
          </div>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Deal</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.map((comm) => {
              const isExpanded = expandedRows.has(comm.id);
              const calcDetails = comm.calcDetails || {};

              return (
                <>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell>
                      <button
                        className="p-1"
                        onClick={() => toggleRow(comm.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {comm.deal?.dealType ? (
                        <span className="capitalize">{comm.deal.dealType}</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{comm.deal?.customerName || "-"}</TableCell>
                    <TableCell>{formatDate(comm.deal?.closeDate || null)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(comm.commissionType)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(comm.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(comm.status)}>
                        {comm.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-gray-50">
                        <div className="p-4 space-y-2 text-sm">
                          <div>
                            <span className="font-semibold">Formula:</span>{" "}
                            {calcDetails.formula || "N/A"}
                          </div>
                          {calcDetails.pay_plan && (
                            <div>
                              <span className="font-semibold">Pay Plan:</span>{" "}
                              {calcDetails.pay_plan.name || calcDetails.pay_plan.id}
                            </div>
                          )}
                          {calcDetails.commission_rule && (
                            <div>
                              <span className="font-semibold">Rule:</span>{" "}
                              {calcDetails.commission_rule.name || calcDetails.commission_rule.id}
                              {calcDetails.commission_rule.calc_method && (
                                <span className="text-gray-500 ml-2">
                                  ({calcDetails.commission_rule.calc_method})
                                </span>
                              )}
                            </div>
                          )}
                          {calcDetails.setter_tier && (
                            <div>
                              <span className="font-semibold">Setter Tier:</span>{" "}
                              {calcDetails.setter_tier}
                            </div>
                          )}
                          {calcDetails.deal && (
                            <div className="mt-2 pt-2 border-t">
                              <span className="font-semibold">Deal Details:</span>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                <li>Type: {calcDetails.deal.deal_type}</li>
                                <li>Value: {formatCurrency(calcDetails.deal.deal_value?.toString() || "0")}</li>
                                {calcDetails.deal.system_size_kw && (
                                  <li>Size: {calcDetails.deal.system_size_kw} kW</li>
                                )}
                                {calcDetails.deal.ppw && (
                                  <li>PPW: ${calcDetails.deal.ppw}</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
