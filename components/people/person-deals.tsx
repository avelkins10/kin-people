"use client";

import { useMemo } from "react";
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
import { useDeals } from "@/hooks/use-deals-data";
import { useCommissions } from "@/hooks/use-commissions-data";

interface PersonDealsProps {
  personId: string;
}

interface Deal {
  deal: {
    id: string;
    customerName: string | null;
    dealType: string;
    systemSizeKw: string | null;
    dealValue: string;
    closeDate: string | null;
    saleDate: string | null;
    status: string;
    isSelfGen: boolean;
  };
  setter: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  closer: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  commissions?: Array<{
    id: string;
    amount: string;
    commissionType: string;
    status: string;
  }>;
}

export function PersonDeals({ personId }: PersonDealsProps) {
  // Fetch deals where person is setter - React Query caches this
  const { data: setterDeals = [], isLoading: setterLoading } = useDeals({
    setterId: personId,
  });

  // Fetch deals where person is closer - React Query caches this
  const { data: closerDeals = [], isLoading: closerLoading } = useDeals({
    closerId: personId,
  });

  // Fetch all commissions for this person - React Query caches this
  const { data: commissions = [] } = useCommissions({ personId });

  // Merge deals and attach commissions
  const deals = useMemo(() => {
    // Merge and deduplicate by deal ID
    const dealMap = new Map<string, any>();
    [...setterDeals, ...closerDeals].forEach((deal: any) => {
      if (!dealMap.has(deal.deal.id)) {
        dealMap.set(deal.deal.id, deal);
      }
    });

    const personDeals = Array.from(dealMap.values());

    // Attach commissions to deals
    return personDeals.map((deal) => ({
      ...deal,
      commissions: commissions.filter(
        (c: any) => c.commission.dealId === deal.deal.id
      ),
    }));
  }, [setterDeals, closerDeals, commissions]);

  const loading = setterLoading || closerLoading;

  function formatCurrency(value: string): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  function getRole(deal: Deal): string {
    const isSetter = deal.setter && deal.setter.id === personId;
    const isCloser = deal.closer && deal.closer.id === personId;
    if (isSetter && isCloser) return "Self Gen";
    if (isSetter) return "Setter";
    if (isCloser) return "Closer";
    return "-";
  }

  function getPersonCommission(deal: Deal): number {
    if (!deal.commissions || deal.commissions.length === 0) return 0;
    return deal.commissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading deals...</div>;
  }

  if (deals.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No deals found for this person.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Deal Type</TableHead>
            <TableHead>System Size</TableHead>
            <TableHead>Deal Value</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Close Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((item) => {
            const deal = item.deal;
            const role = getRole(item);
            const commission = getPersonCommission(item);

            return (
              <TableRow key={deal.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  {deal.customerName || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={role === "Self Gen" ? "default" : "outline"}>
                    {role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="capitalize">{item.deal.dealType}</span>
                </TableCell>
                <TableCell>
                  {deal.systemSizeKw
                    ? `${parseFloat(deal.systemSizeKw).toFixed(2)} kW`
                    : "-"}
                </TableCell>
                <TableCell>{formatCurrency(deal.dealValue)}</TableCell>
                <TableCell className="font-medium">
                  {commission > 0 ? formatCurrency(commission.toString()) : "-"}
                </TableCell>
                <TableCell>{formatDate(deal.closeDate || deal.saleDate)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{deal.status}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
