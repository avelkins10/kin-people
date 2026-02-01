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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

export interface RecentDealItem {
  deal: {
    id: string;
    customerName: string | null;
    dealValue: string;
    closeDate: string | null;
    saleDate: string | null;
    status: string;
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
}

interface RecentDealsWidgetProps {
  deals: RecentDealItem[];
}

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

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
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

export function RecentDealsWidget({ deals }: RecentDealsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Deals</CardTitle>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No deals found. Create your first deal to get started.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Setter</TableHead>
                  <TableHead className="text-xs">Closer</TableHead>
                  <TableHead className="text-xs">Deal Value</TableHead>
                  <TableHead className="text-xs">Close Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((item) => {
                  const deal = item.deal;
                  const setterName = item.setter
                    ? `${item.setter.firstName} ${item.setter.lastName}`
                    : "-";
                  const closerName = item.closer
                    ? `${item.closer.firstName} ${item.closer.lastName}`
                    : "-";
                  return (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium text-sm">
                        {deal.customerName || "-"}
                      </TableCell>
                      <TableCell className="text-sm">{setterName}</TableCell>
                      <TableCell className="text-sm">{closerName}</TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(deal.dealValue)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(deal.closeDate || deal.saleDate)}
                      </TableCell>
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
        )}
        <Link href="/deals" className="block mt-4">
          <Button variant="outline" className="w-full" aria-label="View all deals">
            View All Deals
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
