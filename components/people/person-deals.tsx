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
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeals() {
      try {
        // Fetch deals where person is setter OR closer separately
        const [setterResponse, closerResponse] = await Promise.all([
          fetch(`/api/deals?setterId=${personId}`),
          fetch(`/api/deals?closerId=${personId}`),
        ]);

        const setterDeals = setterResponse.ok ? await setterResponse.json() : [];
        const closerDeals = closerResponse.ok ? await closerResponse.json() : [];

        // Merge and deduplicate by deal ID
        const dealMap = new Map<string, Deal>();
        [...setterDeals, ...closerDeals].forEach((deal: Deal) => {
          if (!dealMap.has(deal.deal.id)) {
            dealMap.set(deal.deal.id, deal);
          }
        });

        const personDeals = Array.from(dealMap.values());

          // Fetch commissions for each deal
          const dealsWithCommissions = await Promise.all(
            personDeals.map(async (deal: Deal) => {
              const commResponse = await fetch(`/api/deals/${deal.deal.id}`);
              if (commResponse.ok) {
                const dealData = await commResponse.json();
                return {
                  ...deal,
                  commissions: dealData.commissions?.filter(
                    (c: { personId: string }) => c.personId === personId
                  ) || [],
                };
              }
              return deal;
            })
          );

          setDeals(dealsWithCommissions);
        }
      } catch (error) {
        console.error("Error fetching deals:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, [personId]);

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
