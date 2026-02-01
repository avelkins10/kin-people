"use client";

import { useState, useEffect } from "react";
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
import { CommissionStatusDropdown } from "./commission-status-dropdown";

interface Commission {
  commission: {
    id: string;
    dealId: string;
    personId: string;
    commissionType: string;
    amount: string;
    status: string;
    calcDetails: any;
    createdAt: string;
  };
  deal: {
    id: string;
    customerName: string | null;
    closeDate: string | null;
    dealType: string;
    dealValue: string;
    systemSizeKw: string | null;
    ppw: string | null;
    setterId: string;
    closerId: string;
    isSelfGen: boolean;
  };
  person: {
    id: string;
    firstName: string;
    lastName: string;
  };
  setter: {
    id: string;
    firstName: string;
    lastName: string;
    setterTier: string | null;
  } | null;
  closer: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  office: {
    id: string;
    name: string;
  } | null;
}

interface CommissionsTableProps {
  commissions: Commission[];
  currentUserId: string;
  canApprove: boolean;
  onRefresh?: () => void;
}

export function CommissionsTable({
  commissions,
  currentUserId,
  canApprove,
  onRefresh,
}: CommissionsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedData, setExpandedData] = useState<Record<string, any>>({});

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

  function getStatusBadgeVariant(
    status: string
  ): "default" | "secondary" | "destructive" | "outline" {
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
      override_reports_to_l1: "Override (Team Lead)",
      override_reports_to_l2: "Override (Area Director)",
      override_recruited_by_l1: "Recruiting L1",
      override_recruited_by_l2: "Recruiting L2",
    };
    return labels[type] || type;
  }

  async function toggleRow(commissionId: string, dealId: string) {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(commissionId)) {
      newExpanded.delete(commissionId);
      setExpandedRows(newExpanded);
    } else {
      newExpanded.add(commissionId);
      setExpandedRows(newExpanded);

      // Fetch full commission details if not already loaded
      if (!expandedData[commissionId]) {
        try {
          const response = await fetch(`/api/commissions/${commissionId}`);
          if (response.ok) {
            const data = await response.json();
            setExpandedData((prev) => ({
              ...prev,
              [commissionId]: data,
            }));
          }
        } catch (error) {
          console.error("Error fetching commission details:", error);
        }
      }
    }
  }

  function handleStatusUpdate() {
    if (onRefresh) {
      onRefresh();
    }
  }

  if (commissions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        No commissions found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Deal Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            {canApprove && <TableHead className="w-12"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.map((item) => {
            const { commission, deal } = item;
            const isExpanded = expandedRows.has(commission.id);
            const expanded = expandedData[commission.id];
            const calcDetails = commission.calcDetails || {};

            return (
              <>
                <TableRow key={commission.id} className="hover:bg-gray-50">
                  <TableCell>
                    <button
                      className="p-1"
                      onClick={() => toggleRow(commission.id, deal.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {deal.customerName || "-"}
                  </TableCell>
                  <TableCell>{formatDate(deal.closeDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTypeLabel(commission.commissionType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(commission.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(commission.status)}>
                      {commission.status}
                    </Badge>
                  </TableCell>
                  {canApprove && (
                    <TableCell>
                      <CommissionStatusDropdown
                        commissionId={commission.id}
                        currentStatus={commission.status}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    </TableCell>
                  )}
                </TableRow>
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={canApprove ? 7 : 6} className="bg-gray-50 p-0">
                      <div className="p-6 space-y-6">
                        {/* Deal Details */}
                        <div>
                          <h4 className="font-semibold mb-3">Deal Details</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Customer:</span>
                              <p className="font-medium">{deal.customerName || "-"}</p>
                            </div>
                            {deal.systemSizeKw && (
                              <div>
                                <span className="text-gray-600">System Size:</span>
                                <p className="font-medium">{deal.systemSizeKw} kW</p>
                              </div>
                            )}
                            {deal.ppw && (
                              <div>
                                <span className="text-gray-600">PPW:</span>
                                <p className="font-medium">${deal.ppw}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Deal Value:</span>
                              <p className="font-medium">{formatCurrency(deal.dealValue)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Close Date:</span>
                              <p className="font-medium">{formatDate(deal.closeDate)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Deal Participants */}
                        <div>
                          <h4 className="font-semibold mb-3">Deal Participants</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {item.setter && (
                              <div>
                                <span className="text-gray-600">Setter:</span>
                                <p className="font-medium">
                                  {item.setter.firstName} {item.setter.lastName}
                                  {item.setter.setterTier && (
                                    <Badge variant="outline" className="ml-2">
                                      {item.setter.setterTier}
                                    </Badge>
                                  )}
                                </p>
                              </div>
                            )}
                            {item.closer && (
                              <div>
                                <span className="text-gray-600">Closer:</span>
                                <p className="font-medium">
                                  {item.closer.firstName} {item.closer.lastName}
                                </p>
                              </div>
                            )}
                            {deal.isSelfGen && (
                              <div>
                                <Badge variant="secondary">Self Gen</Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Commission Breakdown */}
                        <div>
                          <h4 className="font-semibold mb-3">Commission Breakdown</h4>
                          {expanded?.allDealCommissions ? (
                            <div className="space-y-2">
                              {expanded.allDealCommissions.map((comm: any) => (
                                <div
                                  key={comm.id}
                                  className="border rounded-lg p-4 bg-white"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">
                                        {getTypeLabel(comm.commissionType)}
                                      </Badge>
                                      <span className="text-sm text-gray-600">
                                        {comm.person?.firstName} {comm.person?.lastName}
                                      </span>
                                    </div>
                                    <span className="font-semibold">
                                      {formatCurrency(comm.amount)}
                                    </span>
                                  </div>
                                  {comm.calcDetails?.formula && (
                                    <div className="text-sm text-gray-600 mt-2">
                                      <span className="font-medium">Formula:</span>{" "}
                                      {comm.calcDetails.formula}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Formula:</span>{" "}
                                {calcDetails.formula || "N/A"}
                              </div>
                              {calcDetails.pay_plan && (
                                <div className="mt-1">
                                  <span className="font-medium">Pay Plan:</span>{" "}
                                  {calcDetails.pay_plan.name || calcDetails.pay_plan.id}
                                </div>
                              )}
                              {calcDetails.commission_rule && (
                                <div className="mt-1">
                                  <span className="font-medium">Rule:</span>{" "}
                                  {calcDetails.commission_rule.name ||
                                    calcDetails.commission_rule.id}
                                  {calcDetails.commission_rule.calc_method && (
                                    <span className="text-gray-500 ml-2">
                                      ({calcDetails.commission_rule.calc_method})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Org Snapshot */}
                        {expanded?.orgSnapshot && (
                          <div>
                            <h4 className="font-semibold mb-3">Org Snapshot</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Role:</span>
                                <p className="font-medium">
                                  {expanded.orgSnapshot.roleName || "-"}
                                </p>
                              </div>
                              {expanded.orgSnapshot.setterTier && (
                                <div>
                                  <span className="text-gray-600">Setter Tier:</span>
                                  <p className="font-medium">
                                    {expanded.orgSnapshot.setterTier}
                                  </p>
                                </div>
                              )}
                              {expanded.orgSnapshot.officeName && (
                                <div>
                                  <span className="text-gray-600">Office:</span>
                                  <p className="font-medium">
                                    {expanded.orgSnapshot.officeName}
                                  </p>
                                </div>
                              )}
                              {expanded.orgSnapshot.reportsToName && (
                                <div>
                                  <span className="text-gray-600">Manager:</span>
                                  <p className="font-medium">
                                    {expanded.orgSnapshot.reportsToName}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Pay Plan & Rules */}
                        {expanded?.payPlan && (
                          <div>
                            <h4 className="font-semibold mb-3">Pay Plan & Rules</h4>
                            <div className="text-sm">
                              <div>
                                <span className="text-gray-600">Pay Plan:</span>{" "}
                                <span className="font-medium">{expanded.payPlan.name}</span>
                              </div>
                              {expanded.commissionRule && (
                                <div className="mt-2">
                                  <span className="text-gray-600">Commission Rule:</span>{" "}
                                  <span className="font-medium">
                                    {expanded.commissionRule.name}
                                  </span>
                                  <span className="text-gray-500 ml-2">
                                    ({expanded.commissionRule.calcMethod})
                                  </span>
                                </div>
                              )}
                            </div>
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
  );
}
