"use client";

import React from "react";
import { useSettingsData } from "@/hooks/use-settings-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsOverview } from "@/components/settings/settings-overview";
import { SettingsRolesSection } from "@/components/settings/SettingsRolesSection";
import { SettingsOfficesSection } from "@/components/settings/SettingsOfficesSection";
import { SettingsTeamsSection } from "@/components/settings/SettingsTeamsSection";
import { SettingsPayPlansSection } from "@/components/settings/SettingsPayPlansSection";
import { SettingsCommissionRulesSection } from "@/components/settings/SettingsCommissionRulesSection";
import { SettingsOnboardingMetricsSection } from "@/components/settings/SettingsOnboardingMetricsSection";
import { SettingsHistorySection } from "@/components/settings/SettingsHistorySection";
import { SettingsUsersSection } from "@/components/settings/SettingsUsersSection";
import { SettingsIntegrationsSection } from "@/components/settings/SettingsIntegrationsSection";
import {
  LayoutDashboard,
  Users,
  Shield,
  MapPin,
  UsersRound,
  FileText,
  Percent,
  GraduationCap,
  History,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsPage() {
  const { data, loading, error, refetch } = useSettingsData();

  const activePayPlans = data.payPlans.filter((p) => p.isActive).length;
  const totalCommissionRules = data.commissionRules.length;
  const peopleWithPayPlans = data.payPlans.reduce((sum, p) => sum + (p.peopleCount ?? 0), 0);
  const peopleWithoutPayPlans = Math.max(0, data.people.length - peopleWithPayPlans);

  return (
    <div className="space-y-6">
      <header className="shrink-0">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-black uppercase">
          Organization
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure roles, offices, teams, users, and compensation. Changes are saved to the database and apply across the app.
        </p>
      </header>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="users" className="w-full">
        <TabsList
          className={cn(
            "w-full justify-start gap-0.5 rounded-none border-b border-gray-200 bg-transparent p-0 h-auto min-h-10",
            "overflow-x-auto flex-nowrap md:flex-wrap"
          )}
        >
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <LayoutDashboard className="h-4 w-4 mr-2 shrink-0" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <Users className="h-4 w-4 mr-2 shrink-0" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <Shield className="h-4 w-4 mr-2 shrink-0" />
            Roles
          </TabsTrigger>
          <TabsTrigger
            value="offices"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <MapPin className="h-4 w-4 mr-2 shrink-0" />
            Offices
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <UsersRound className="h-4 w-4 mr-2 shrink-0" />
            Teams
          </TabsTrigger>
          <TabsTrigger
            value="pay-plans"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <FileText className="h-4 w-4 mr-2 shrink-0" />
            Pay Plans
          </TabsTrigger>
          <TabsTrigger
            value="commission-rules"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <Percent className="h-4 w-4 mr-2 shrink-0" />
            Commission
          </TabsTrigger>
          <TabsTrigger
            value="onboarding"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <GraduationCap className="h-4 w-4 mr-2 shrink-0" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <History className="h-4 w-4 mr-2 shrink-0" />
            History
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <Plug className="h-4 w-4 mr-2 shrink-0" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 focus-visible:outline-none">
          <SettingsOverview
            activePayPlans={activePayPlans}
            totalCommissionRules={totalCommissionRules}
            peopleWithoutPayPlans={peopleWithoutPayPlans}
          />
        </TabsContent>

        <TabsContent value="users" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsUsersSection
              people={data.people}
              roles={data.roles}
              offices={data.offices}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsRolesSection
              roles={data.roles}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="offices" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsOfficesSection
              offices={data.offices}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="teams" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsTeamsSection
              teams={data.teams}
              offices={data.offices}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="pay-plans" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsPayPlansSection
              payPlans={data.payPlans}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="commission-rules" className="mt-6 focus-visible:outline-none">
          <div className="max-w-3xl">
            <SettingsCommissionRulesSection
              commissionRules={data.commissionRules}
              payPlans={data.payPlans}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsOnboardingMetricsSection onRefetch={refetch} />
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6 focus-visible:outline-none">
          <div className="max-w-3xl">
            <SettingsHistorySection />
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsIntegrationsSection />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
