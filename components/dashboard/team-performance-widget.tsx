"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface TeamPerformanceMetrics {
  totalDeals: number;
  totalCommissionValue: number;
  teamMemberCount?: number;
  label: string;
}

interface TeamPerformanceWidgetProps {
  metrics: TeamPerformanceMetrics;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function TeamPerformanceWidget({ metrics }: TeamPerformanceWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{metrics.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Deals</p>
            <p className="text-2xl font-bold">{metrics.totalDeals}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Commission Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(metrics.totalCommissionValue)}
            </p>
          </div>
          {metrics.teamMemberCount !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold">{metrics.teamMemberCount}</p>
            </div>
          )}
        </div>
        <Link href="/people" className="block mt-4">
          <Button
            variant="outline"
            className="w-full"
            aria-label="View people or team"
          >
            {metrics.teamMemberCount !== undefined ? "View Team" : "View People"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
