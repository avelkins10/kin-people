"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, FileText, TrendingUp } from "lucide-react";

interface SettingsOverviewProps {
  activePayPlans: number;
  totalCommissionRules: number;
  peopleWithoutPayPlans?: number;
  recentChanges?: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

export function SettingsOverview({
  activePayPlans,
  totalCommissionRules,
  peopleWithoutPayPlans = 0,
  recentChanges = [],
}: SettingsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Pay Plans</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activePayPlans}</div>
          <p className="text-xs text-muted-foreground">
            Currently active pay plans
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Commission Rules</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCommissionRules}</div>
          <p className="text-xs text-muted-foreground">
            Total active rules
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">People Without Pay Plans</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{peopleWithoutPayPlans}</div>
          <p className="text-xs text-muted-foreground">
            {peopleWithoutPayPlans > 0 ? (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                Action required
              </span>
            ) : (
              "All people assigned"
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Changes</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentChanges.length}</div>
          <p className="text-xs text-muted-foreground">
            Changes in last 30 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
