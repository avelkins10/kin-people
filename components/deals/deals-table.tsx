"use client";

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
    email: string;
  } | null;
  closer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  office: {
    id: string;
    name: string;
  } | null;
}

interface DealsTableProps {
  initialDeals: Deal[];
}

export function DealsTable({ initialDeals }: DealsTableProps) {
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

  function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "sold":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  }

  if (initialDeals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        <p>No deals found. Create your first deal to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Setter</TableHead>
            <TableHead>Closer</TableHead>
            <TableHead>Deal Type</TableHead>
            <TableHead>System Size</TableHead>
            <TableHead>Deal Value</TableHead>
            <TableHead>Close Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialDeals.map((item) => {
            const deal = item.deal;
            const setterName = item.setter
              ? `${item.setter.firstName} ${item.setter.lastName}`
              : "-";
            const closerName = item.closer
              ? `${item.closer.firstName} ${item.closer.lastName}`
              : "-";

            return (
              <TableRow
                key={deal.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  // TODO: Navigate to deal detail page
                  console.log("Navigate to deal:", deal.id);
                }}
              >
                <TableCell className="font-medium">
                  {deal.customerName || "-"}
                  {deal.isSelfGen && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Self Gen
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{setterName}</TableCell>
                <TableCell>{closerName}</TableCell>
                <TableCell>
                  <span className="capitalize">{deal.dealType}</span>
                </TableCell>
                <TableCell>
                  {deal.systemSizeKw ? `${parseFloat(deal.systemSizeKw).toFixed(2)} kW` : "-"}
                </TableCell>
                <TableCell>{formatCurrency(deal.dealValue)}</TableCell>
                <TableCell>{formatDate(deal.closeDate || deal.saleDate)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(deal.status)}>
                    {deal.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
